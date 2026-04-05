-- Returns Management Procedures

-- 1. Procedure to Request a Return
CREATE OR REPLACE PROCEDURE mars.request_return(
    p_order_id UUID, 
    p_customer_id UUID, 
    p_reason TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_return_id UUID;
    v_total_amount DECIMAL(10, 2);
BEGIN
    -- Only allow if the order belongs to the customer and is 'Delivered'
    IF NOT EXISTS (SELECT 1 FROM mars.Orders WHERE Order_ID = p_order_id AND Customer_ID = p_customer_id AND Order_Status = 'Delivered') THEN
        RAISE EXCEPTION 'Order is not eligible for return or does not belong to this customer.';
    END IF;

    -- Get the total amount to refund
    SELECT Total_Amount INTO v_total_amount FROM mars.Orders WHERE Order_ID = p_order_id;

    -- Insert the core return record and capture the new UUID
    -- Since it's a PROCEDURE, we can't easily RETURNING into a variable for standard INSERT without CTE, so we use gen_random_uuid directly
    v_return_id := gen_random_uuid();

    INSERT INTO mars.Returns (Return_ID, Order_ID, Customer_ID, Reason, Status, Refund_Amount)
    VALUES (v_return_id, p_order_id, p_customer_id, p_reason, 'Pending', v_total_amount);

    -- Copy all Order Items into the Return Items ledger
    INSERT INTO mars.Return_Items (Return_ID, Product_ID, Quantity)
    SELECT v_return_id, Product_ID, Quantity 
    FROM mars.Order_Items 
    WHERE Order_ID = p_order_id;

    -- Flag the Order status
    UPDATE mars.Orders 
    SET Order_Status = 'Return Pending' 
    WHERE Order_ID = p_order_id;

END;
$$;

-- 2. Procedure to Approve a Return
CREATE OR REPLACE PROCEDURE mars.approve_return(
    p_return_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    r_item RECORD;
BEGIN
    -- Verify the return exists and is pending
    IF NOT EXISTS (SELECT 1 FROM mars.Returns WHERE Return_ID = p_return_id AND Status = 'Pending') THEN
        RAISE EXCEPTION 'Return request not found or is already processed.';
    END IF;

    SELECT Order_ID INTO v_order_id FROM mars.Returns WHERE Return_ID = p_return_id;

    -- Update Returns
    UPDATE mars.Returns SET Status = 'Approved' WHERE Return_ID = p_return_id;

    -- Return the Stock Quantities loop
    FOR r_item IN SELECT Product_ID, Quantity FROM mars.Return_Items WHERE Return_ID = p_return_id
    LOOP
        UPDATE mars.Products 
        SET Stock_Quantity = Stock_Quantity + r_item.Quantity 
        WHERE Product_ID = r_item.Product_ID;
    END LOOP;

    -- Nullify Payments
    UPDATE mars.Payments 
    SET Payment_Status = 'Refunded' 
    WHERE Order_ID = v_order_id;

    -- Update Order Status
    UPDATE mars.Orders 
    SET Order_Status = 'Returned' 
    WHERE Order_ID = v_order_id;

END;
$$;
