-- ============================================================
-- MARS Database Functions & Procedures Migration
-- Run this in your Neon DB SQL Editor
-- ============================================================

-- ============================================================
-- 1. PROCEDURE: place_order
--    Replaces the massive 8-step placeOrder JS logic
--    Atomically: validates stock, creates order, order_items,
--    deducts stock, creates shipment, clears cart, creates payment
-- ============================================================
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
    -- Validate coupon if provided
    IF p_coupon_id IS NOT NULL THEN
        SELECT Discount_Percent INTO v_discount_percent
        FROM mars.Coupons
        WHERE Coupon_ID = p_coupon_id AND Expiry_Date >= CURRENT_TIMESTAMP;

        IF v_discount_percent IS NULL THEN
            RAISE EXCEPTION 'Invalid or expired coupon';
        END IF;
    END IF;

    -- Get cart
    SELECT Cart_ID INTO v_cart_id
    FROM mars.Carts WHERE Customer_ID = p_customer_id;

    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'Cart not found for this customer';
    END IF;

    -- Validate stock and calculate total
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

    -- Create order
    INSERT INTO mars.Orders (Customer_ID, Coupon_ID, Delivery_Fee, Total_Amount, Discounted_Net_Price, Order_Status)
    VALUES (p_customer_id, p_coupon_id, p_delivery_fee, v_total_amount, v_discounted_net, 'Pending')
    RETURNING Order_ID INTO v_order_id;

    -- Create order items + deduct stock
    FOR r_item IN 
        SELECT ci.Product_ID, ci.Quantity, p.Unit_Price
        FROM mars.Cart_Items ci
        JOIN mars.Products p ON ci.Product_ID = p.Product_ID
        WHERE ci.Cart_ID = v_cart_id
    LOOP
        INSERT INTO mars.Order_Items (Order_ID, Product_ID, Quantity, Net_Price)
        VALUES (v_order_id, r_item.Product_ID, r_item.Quantity, r_item.Unit_Price * r_item.Quantity);

        UPDATE mars.Products
        SET Stock_Quantity = Stock_Quantity - r_item.Quantity
        WHERE Product_ID = r_item.Product_ID;
    END LOOP;

    -- Create shipment
    INSERT INTO mars.Shipments (Order_ID, Address_ID) VALUES (v_order_id, p_address_id);

    -- Clear cart
    DELETE FROM mars.Cart_Items WHERE Cart_ID = v_cart_id;

    -- Create payment
    INSERT INTO mars.Payments (Order_ID, Payment_Method, Payment_Status)
    VALUES (v_order_id, p_payment_method, 
            CASE WHEN p_payment_method = 'Cash on Delivery' THEN 'Pending' ELSE 'Completed' END);

END;
$$;


-- ============================================================
-- 2. PROCEDURE: cancel_order
--    Replaces the JS cancellation logic in updateOrderStatus
--    Atomically: restores stock, voids payment, logs shipment
-- ============================================================
CREATE OR REPLACE PROCEDURE mars.cancel_order(
    p_order_id UUID,
    p_seller_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    r_item RECORD;
    v_shipment_id UUID;
BEGIN
    -- Authorization: seller must own at least one product in the order
    IF NOT EXISTS (
        SELECT 1 FROM mars.Order_Items oi
        JOIN mars.Products pr ON pr.Product_ID = oi.Product_ID
        WHERE oi.Order_ID = p_order_id AND pr.Seller_ID = p_seller_id
    ) THEN
        RAISE EXCEPTION 'Not authorized to cancel this order';
    END IF;

    -- Update order status
    UPDATE mars.Orders SET Order_Status = 'Cancelled' WHERE Order_ID = p_order_id;

    -- Log shipment history
    SELECT Shipment_ID INTO v_shipment_id FROM mars.Shipments WHERE Order_ID = p_order_id;
    IF v_shipment_id IS NOT NULL THEN
        INSERT INTO mars.Shipment_Status_History (Shipment_ID, Status)
        VALUES (v_shipment_id, 'Status updated to: Cancelled');
    END IF;

    -- Restore stock for each item
    FOR r_item IN SELECT Product_ID, Quantity FROM mars.Order_Items WHERE Order_ID = p_order_id
    LOOP
        UPDATE mars.Products 
        SET Stock_Quantity = Stock_Quantity + r_item.Quantity
        WHERE Product_ID = r_item.Product_ID;
    END LOOP;

    -- Void payment
    UPDATE mars.Payments SET Payment_Status = 'Cancelled' WHERE Order_ID = p_order_id;

END;
$$;


-- ============================================================
-- 3. FUNCTION: add_to_cart
--    Replaces the multi-step addItemToCart JS logic
--    Atomically: ensures cart, validates stock, upserts item
-- ============================================================
CREATE OR REPLACE FUNCTION mars.add_to_cart(
    p_customer_id UUID,
    p_product_id UUID,
    p_quantity INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_cart_id UUID;
    v_price DECIMAL(10,2);
    v_stock INT;
    v_seller_id UUID;
    v_current_qty INT;
    v_net_price DECIMAL(10,2);
BEGIN
    -- Get product info
    SELECT Unit_Price, Stock_Quantity, Seller_ID
    INTO v_price, v_stock, v_seller_id
    FROM mars.Products WHERE Product_ID = p_product_id;

    IF v_price IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_seller_id = p_customer_id THEN
        RAISE EXCEPTION 'You cannot buy your own product';
    END IF;

    -- Ensure cart exists
    INSERT INTO mars.Carts (Customer_ID, Total_Amount) VALUES (p_customer_id, 0)
    ON CONFLICT (Customer_ID) DO NOTHING;

    SELECT Cart_ID INTO v_cart_id FROM mars.Carts WHERE Customer_ID = p_customer_id;

    -- Check current qty in cart
    SELECT COALESCE(Quantity, 0) INTO v_current_qty
    FROM mars.Cart_Items WHERE Cart_ID = v_cart_id AND Product_ID = p_product_id;

    IF v_current_qty IS NULL THEN v_current_qty := 0; END IF;

    IF v_current_qty + p_quantity > v_stock THEN
        RAISE EXCEPTION 'Insufficient stock. Only % available.', v_stock - v_current_qty;
    END IF;

    v_net_price := v_price * p_quantity;

    -- Upsert cart item
    INSERT INTO mars.Cart_Items (Cart_ID, Product_ID, Quantity, Net_Price)
    VALUES (v_cart_id, p_product_id, p_quantity, v_net_price)
    ON CONFLICT (Cart_ID, Product_ID) 
    DO UPDATE SET Quantity = mars.Cart_Items.Quantity + p_quantity,
                  Net_Price = mars.Cart_Items.Net_Price + v_net_price;

END;
$$;


-- ============================================================
-- 4. TRIGGER: auto-update seller rating after review insert/delete
--    Keeps Sellers.Rating always in sync without manual recalc
-- ============================================================
CREATE OR REPLACE FUNCTION mars.update_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id UUID;
    v_avg_rating DECIMAL(3,2);
BEGIN
    -- Get seller from the product being reviewed
    IF TG_OP = 'DELETE' THEN
        SELECT Seller_ID INTO v_seller_id FROM mars.Products WHERE Product_ID = OLD.Product_ID;
    ELSE
        SELECT Seller_ID INTO v_seller_id FROM mars.Products WHERE Product_ID = NEW.Product_ID;
    END IF;

    -- Recalculate average rating across ALL the seller's products
    SELECT COALESCE(AVG(r.Rating), 0) INTO v_avg_rating
    FROM mars.Reviews r
    JOIN mars.Products p ON r.Product_ID = p.Product_ID
    WHERE p.Seller_ID = v_seller_id;

    UPDATE mars.Sellers SET Rating = v_avg_rating WHERE Seller_ID = v_seller_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_seller_rating ON mars.Reviews;
CREATE TRIGGER trg_update_seller_rating
AFTER INSERT OR DELETE ON mars.Reviews
FOR EACH ROW
EXECUTE FUNCTION mars.update_seller_rating();


-- ============================================================
-- 5. FUNCTION: get_product_stats  (utility for product pages)
--    Returns avg_rating, review_count, order_count in one call
-- ============================================================
CREATE OR REPLACE FUNCTION mars.get_product_stats(p_product_id UUID)
RETURNS TABLE (
    avg_rating DECIMAL(3,2),
    review_count BIGINT,
    order_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(r.Rating)::DECIMAL(3,2), 0.00),
        COUNT(DISTINCT r.Review_ID),
        COALESCE((SELECT SUM(oi.Quantity) FROM mars.Order_Items oi WHERE oi.Product_ID = p_product_id), 0)
    FROM mars.Reviews r
    WHERE r.Product_ID = p_product_id;
END;
$$;
