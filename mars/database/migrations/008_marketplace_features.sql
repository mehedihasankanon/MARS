-- ============================================================
-- MARS Marketplace Feature Upgrades (Returns images, scam reports,
-- seller approval gating, per-item order status, delivery confirmation)
-- ============================================================

-- 1) Per-item order status
ALTER TABLE mars.Order_Items
ADD COLUMN IF NOT EXISTS Item_Status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS Delivered_Confirmed BOOLEAN DEFAULT FALSE;

-- Backfill item status from legacy order status (best-effort)
UPDATE mars.Order_Items oi
SET Item_Status = COALESCE(o.Order_Status, 'Pending')
FROM mars.Orders o
WHERE o.Order_ID = oi.Order_ID
  AND (oi.Item_Status IS NULL OR oi.Item_Status = 'Pending');

-- Keep Orders.Order_Status in sync as a summary of items
CREATE OR REPLACE FUNCTION mars.recompute_order_status(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
  v_delivered INT;
  v_cancelled INT;
  v_shipped INT;
  v_processing INT;
  v_pending INT;
  v_new_status VARCHAR(50);
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE Item_Status = 'Delivered'),
    COUNT(*) FILTER (WHERE Item_Status = 'Cancelled'),
    COUNT(*) FILTER (WHERE Item_Status = 'Shipped'),
    COUNT(*) FILTER (WHERE Item_Status = 'Processing'),
    COUNT(*) FILTER (WHERE Item_Status = 'Pending')
  INTO v_total, v_delivered, v_cancelled, v_shipped, v_processing, v_pending
  FROM mars.Order_Items
  WHERE Order_ID = p_order_id;

  IF v_total = 0 THEN
    v_new_status := 'Pending';
  ELSIF v_delivered = v_total THEN
    v_new_status := 'Delivered';
  ELSIF v_cancelled = v_total THEN
    v_new_status := 'Cancelled';
  ELSIF v_shipped > 0 THEN
    v_new_status := 'Shipped';
  ELSIF v_processing > 0 THEN
    v_new_status := 'Processing';
  ELSE
    v_new_status := 'Pending';
  END IF;

  UPDATE mars.Orders SET Order_Status = v_new_status WHERE Order_ID = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION mars.trg_recompute_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM mars.recompute_order_status(COALESCE(NEW.Order_ID, OLD.Order_ID));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_order_status ON mars.Order_Items;
CREATE TRIGGER trg_recompute_order_status
AFTER UPDATE OF Item_Status ON mars.Order_Items
FOR EACH ROW
EXECUTE FUNCTION mars.trg_recompute_order_status();

-- Make place_order set initial item status
CREATE OR REPLACE PROCEDURE mars.place_order(
    p_customer_id UUID,
    p_address_id UUID,
    p_coupon_id UUID DEFAULT NULL,
    p_delivery_fee DECIMAL(10,2) DEFAULT 0,
    p_payment_method VARCHAR(50) DEFAULT 'Cash on Delivery'
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_discount_percent DECIMAL(5,2) := 0;
    v_items_total DECIMAL(10,2) := 0;
    v_total_amount DECIMAL(10,2);
    v_discounted_net DECIMAL(10,2);
    v_order_id UUID;
    v_cart_id UUID;
    r_item RECORD;
BEGIN
    IF p_coupon_id IS NOT NULL THEN
        SELECT Discount_Percent INTO v_discount_percent
        FROM mars.Coupons
        WHERE Coupon_ID = p_coupon_id AND Expiry_Date >= CURRENT_TIMESTAMP;

        IF v_discount_percent IS NULL THEN
            RAISE EXCEPTION 'Invalid or expired coupon';
        END IF;
    END IF;

    SELECT Cart_ID INTO v_cart_id
    FROM mars.Carts WHERE Customer_ID = p_customer_id;

    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'Cart not found for this customer';
    END IF;

    FOR r_item IN
        SELECT ci.Product_ID, ci.Quantity, p.Unit_Price, p.Stock_Quantity
        FROM mars.Cart_Items ci
        JOIN mars.Products p ON ci.Product_ID = p.Product_ID
        WHERE ci.Cart_ID = v_cart_id
    LOOP
        IF r_item.Stock_Quantity < r_item.Quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', r_item.Product_ID;
        END IF;
        v_items_total := v_items_total + (r_item.Unit_Price * r_item.Quantity);
    END LOOP;

    IF v_items_total = 0 THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    v_total_amount := v_items_total + p_delivery_fee;
    v_discounted_net := CASE
        WHEN v_discount_percent > 0 THEN v_items_total * (1 - v_discount_percent / 100) + p_delivery_fee
        ELSE v_total_amount
    END;

    INSERT INTO mars.Orders (Customer_ID, Coupon_ID, Delivery_Fee, Total_Amount, Discounted_Net_Price, Order_Status)
    VALUES (p_customer_id, p_coupon_id, p_delivery_fee, v_total_amount, v_discounted_net, 'Pending')
    RETURNING Order_ID INTO v_order_id;

    FOR r_item IN
        SELECT ci.Product_ID, ci.Quantity, p.Unit_Price
        FROM mars.Cart_Items ci
        JOIN mars.Products p ON ci.Product_ID = p.Product_ID
        WHERE ci.Cart_ID = v_cart_id
    LOOP
        INSERT INTO mars.Order_Items (Order_ID, Product_ID, Quantity, Net_Price, Item_Status)
        VALUES (v_order_id, r_item.Product_ID, r_item.Quantity, r_item.Unit_Price * r_item.Quantity, 'Pending');

        UPDATE mars.Products
        SET Stock_Quantity = Stock_Quantity - r_item.Quantity
        WHERE Product_ID = r_item.Product_ID;
    END LOOP;

    INSERT INTO mars.Shipments (Order_ID, Address_ID) VALUES (v_order_id, p_address_id);
    DELETE FROM mars.Cart_Items WHERE Cart_ID = v_cart_id;

    INSERT INTO mars.Payments (Order_ID, Payment_Method, Payment_Status)
    VALUES (v_order_id, p_payment_method,
            CASE WHEN p_payment_method = 'Cash on Delivery' THEN 'Pending' ELSE 'Completed' END);
END;
$$;

-- 2) Returns: images + return request that returns Return_ID
CREATE TABLE IF NOT EXISTS mars.Return_Images (
  Image_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Return_ID UUID NOT NULL REFERENCES mars.Returns(Return_ID) ON DELETE CASCADE,
  Image_URL VARCHAR(255) NOT NULL,
  Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION mars.request_return_returning(
  p_order_id UUID,
  p_customer_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_return_id UUID;
  v_refund_amount DECIMAL(10,2) := 0;
BEGIN
  -- Only allow if the order belongs to the customer and has at least one delivered item
  IF NOT EXISTS (
    SELECT 1
    FROM mars.Orders o
    WHERE o.Order_ID = p_order_id AND o.Customer_ID = p_customer_id
  ) THEN
    RAISE EXCEPTION 'Order does not belong to this customer.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM mars.Order_Items oi
    WHERE oi.Order_ID = p_order_id AND oi.Item_Status = 'Delivered'
  ) THEN
    RAISE EXCEPTION 'No delivered items found for this order yet.';
  END IF;

  v_return_id := gen_random_uuid();

  SELECT COALESCE(SUM(Net_Price), 0) INTO v_refund_amount
  FROM mars.Order_Items
  WHERE Order_ID = p_order_id AND Item_Status = 'Delivered';

  INSERT INTO mars.Returns (Return_ID, Order_ID, Customer_ID, Reason, Status, Refund_Amount)
  VALUES (v_return_id, p_order_id, p_customer_id, p_reason, 'Pending', v_refund_amount);

  -- Only copy delivered items into the return ledger
  INSERT INTO mars.Return_Items (Return_ID, Product_ID, Quantity)
  SELECT v_return_id, Product_ID, Quantity
  FROM mars.Order_Items
  WHERE Order_ID = p_order_id AND Item_Status = 'Delivered';

  RETURN v_return_id;
END;
$$;

-- 3) Scam reports (admin only visibility)
CREATE TABLE IF NOT EXISTS mars.Scam_Reports (
  Report_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Reporter_Customer_ID UUID NOT NULL REFERENCES mars.Customers(Customer_ID) ON DELETE CASCADE,
  Accused_Seller_ID UUID REFERENCES mars.Sellers(Seller_ID) ON DELETE SET NULL,
  Order_ID UUID REFERENCES mars.Orders(Order_ID) ON DELETE SET NULL,
  Product_ID UUID REFERENCES mars.Products(Product_ID) ON DELETE SET NULL,
  Description TEXT NOT NULL,
  Status VARCHAR(20) DEFAULT 'Open',
  Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) Delivery confirmation feedback (customer -> seller)
CREATE TABLE IF NOT EXISTS mars.Delivery_Issues (
  Issue_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  Order_ID UUID NOT NULL REFERENCES mars.Orders(Order_ID) ON DELETE CASCADE,
  Product_ID UUID NOT NULL REFERENCES mars.Products(Product_ID) ON DELETE CASCADE,
  Customer_ID UUID NOT NULL REFERENCES mars.Customers(Customer_ID) ON DELETE CASCADE,
  Seller_ID UUID NOT NULL REFERENCES mars.Sellers(Seller_ID) ON DELETE CASCADE,
  Received_OK BOOLEAN NOT NULL,
  Feedback TEXT,
  Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5) Add notification context for delivery confirmations
ALTER TABLE mars.Notifications
ADD COLUMN IF NOT EXISTS Product_ID UUID REFERENCES mars.Products(Product_ID) ON DELETE SET NULL;

-- Permissions (best-effort; adjust role/user as needed)
DO $$
BEGIN
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON mars.Return_Images TO kanon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON mars.Scam_Reports TO kanon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON mars.Delivery_Issues TO kanon;
  EXCEPTION WHEN undefined_object THEN
    -- ignore if role doesn't exist in this environment
    NULL;
  END;
END;
$$;

