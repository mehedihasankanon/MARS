-- Notification on Question Trigger

CREATE OR REPLACE FUNCTION mars.notify_seller_on_question()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id UUID;
    v_product_name VARCHAR;
BEGIN
    -- Find the seller of the product that was questioned
    SELECT Seller_ID, Name INTO v_seller_id, v_product_name 
    FROM mars.Products 
    WHERE Product_ID = NEW.Product_ID;

    -- Insert a notification for that seller
    INSERT INTO mars.Notifications (User_ID, Message)
    VALUES (v_seller_id, 'A new question was asked on your product: ' || v_product_name);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_seller_on_question ON mars.Questions;
CREATE TRIGGER trg_notify_seller_on_question
AFTER INSERT ON mars.Questions
FOR EACH ROW
EXECUTE FUNCTION mars.notify_seller_on_question();
