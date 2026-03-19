-- 1. Add the Verified column to Reviews
ALTER TABLE mars.Reviews ADD COLUMN IF NOT EXISTS Verified BOOLEAN DEFAULT FALSE;

-- 2. Create the Notifications table
CREATE TABLE IF NOT EXISTS mars.Notifications (
    Notification_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    User_ID UUID NOT NULL,
    Message TEXT NOT NULL,
    Is_Read BOOLEAN DEFAULT FALSE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES mars.Users(User_ID) ON DELETE CASCADE
);

-- 3. Create the Trigger Function to notify sellers
CREATE OR REPLACE FUNCTION mars.notify_seller_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seller_id UUID;
    v_product_name VARCHAR;
BEGIN
    -- Get the seller of the product that was just ordered
    SELECT Seller_ID, Name INTO v_seller_id, v_product_name 
    FROM mars.Products 
    WHERE Product_ID = NEW.Product_ID;

    -- Insert a notification for the seller
    INSERT INTO mars.Notifications (User_ID, Message)
    VALUES (v_seller_id, 'New order received for your product: ' || v_product_name || ' (Qty: ' || NEW.Quantity || ')');

    RETURN NEW;
END;
$$;

-- 4. Attach the trigger to the Order_Items table
DROP TRIGGER IF EXISTS trg_notify_seller_on_order ON mars.Order_Items;
CREATE TRIGGER trg_notify_seller_on_order
AFTER INSERT ON mars.Order_Items
FOR EACH ROW
EXECUTE FUNCTION mars.notify_seller_on_order();

-- 5. Grant permissions so the active Node.js user (kanon) can access the new table
GRANT SELECT, INSERT, UPDATE, DELETE ON mars.Notifications TO kanon;
