-- Order line items and cart net prices use effective unit price (active product offers).
-- place_order applies coupon discount proportionally to each line's net_price.

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
    v_line_net DECIMAL(10,2);
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
        SELECT ci.Product_ID,
               ci.Quantity,
               p.Stock_Quantity,
               (p.Unit_Price * (1 - COALESCE((
                   SELECT MAX(po.Offer_Percent)
                   FROM mars.Product_Offers po
                   WHERE po.Product_ID = p.Product_ID
                     AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date
               ), 0) / 100.0)) AS eff_unit
        FROM mars.Cart_Items ci
        JOIN mars.Products p ON ci.Product_ID = p.Product_ID
        WHERE ci.Cart_ID = v_cart_id
    LOOP
        IF r_item.Stock_Quantity < r_item.Quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', r_item.Product_ID;
        END IF;
        v_items_total := v_items_total + (r_item.eff_unit * r_item.Quantity);
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
        SELECT ci.Product_ID,
               ci.Quantity,
               (p.Unit_Price * (1 - COALESCE((
                   SELECT MAX(po.Offer_Percent)
                   FROM mars.Product_Offers po
                   WHERE po.Product_ID = p.Product_ID
                     AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date
               ), 0) / 100.0)) AS eff_unit
        FROM mars.Cart_Items ci
        JOIN mars.Products p ON ci.Product_ID = p.Product_ID
        WHERE ci.Cart_ID = v_cart_id
    LOOP
        v_line_net := r_item.eff_unit * r_item.Quantity;
        IF v_discount_percent > 0 THEN
            v_line_net := v_line_net * (1 - v_discount_percent / 100);
        END IF;

        INSERT INTO mars.Order_Items (Order_ID, Product_ID, Quantity, Net_Price, Item_Status)
        VALUES (v_order_id, r_item.Product_ID, r_item.Quantity, v_line_net, 'Pending');

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
    v_stock INT;
    v_seller_id UUID;
    v_current_qty INT;
    v_effective_unit DECIMAL(10,2);
BEGIN
    SELECT
        p.Stock_Quantity,
        p.Seller_ID,
        (p.Unit_Price * (1 - COALESCE((
            SELECT MAX(po.Offer_Percent)
            FROM mars.Product_Offers po
            WHERE po.Product_ID = p.Product_ID
              AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date
        ), 0) / 100.0))
    INTO v_stock, v_seller_id, v_effective_unit
    FROM mars.Products p
    WHERE p.Product_ID = p_product_id;

    IF v_effective_unit IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_seller_id = p_customer_id THEN
        RAISE EXCEPTION 'You cannot buy your own product';
    END IF;

    INSERT INTO mars.Carts (Customer_ID, Total_Amount) VALUES (p_customer_id, 0)
    ON CONFLICT (Customer_ID) DO NOTHING;

    SELECT Cart_ID INTO v_cart_id FROM mars.Carts WHERE Customer_ID = p_customer_id;

    SELECT COALESCE(Quantity, 0) INTO v_current_qty
    FROM mars.Cart_Items WHERE Cart_ID = v_cart_id AND Product_ID = p_product_id;

    IF v_current_qty IS NULL THEN v_current_qty := 0; END IF;

    IF v_current_qty + p_quantity > v_stock THEN
        RAISE EXCEPTION 'Insufficient stock. Only % available.', v_stock - v_current_qty;
    END IF;

    INSERT INTO mars.Cart_Items (Cart_ID, Product_ID, Quantity, Net_Price)
    VALUES (v_cart_id, p_product_id, p_quantity, v_effective_unit * p_quantity)
    ON CONFLICT (Cart_ID, Product_ID)
    DO UPDATE SET
        Quantity = mars.Cart_Items.Quantity + p_quantity,
        Net_Price = v_effective_unit * (mars.Cart_Items.Quantity + p_quantity);
END;
$$;
