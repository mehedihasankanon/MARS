-- Store product reference on notifications so the app can link to /products/:id

ALTER TABLE mars.Notifications
ADD COLUMN IF NOT EXISTS Product_ID UUID REFERENCES mars.Products(Product_ID) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION mars.notify_seller_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id UUID;
    v_product_name VARCHAR;
BEGIN
    SELECT Seller_ID, Name INTO v_seller_id, v_product_name
    FROM mars.Products
    WHERE Product_ID = NEW.Product_ID;

    INSERT INTO mars.Notifications (User_ID, Message, Product_ID)
    VALUES (
        v_seller_id,
        'New order received for your product: ' || v_product_name || ' (Qty: ' || NEW.Quantity || ')',
        NEW.Product_ID
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION mars.notify_seller_on_question()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id UUID;
    v_product_name VARCHAR;
BEGIN
    SELECT Seller_ID, Name INTO v_seller_id, v_product_name
    FROM mars.Products
    WHERE Product_ID = NEW.Product_ID;

    INSERT INTO mars.Notifications (User_ID, Message, Product_ID)
    VALUES (
        v_seller_id,
        'A new question was asked on your product: ' || v_product_name,
        NEW.Product_ID
    );

    RETURN NEW;
END;
$$;
