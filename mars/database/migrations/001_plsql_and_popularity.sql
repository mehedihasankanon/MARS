CREATE OR REPLACE FUNCTION get_product_avg_rating(p_product_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $fn$
DECLARE
    avg_val NUMERIC;
BEGIN
    SELECT COALESCE(AVG(Rating), 0) INTO avg_val
    FROM Reviews
    WHERE Product_ID = p_product_id;

    RETURN ROUND(avg_val, 2);
END;
$fn$;


CREATE OR REPLACE FUNCTION update_seller_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $trg$
DECLARE
    v_seller_id UUID;
    v_new_rating NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT Seller_ID INTO v_seller_id FROM Products WHERE Product_ID = OLD.Product_ID;
    ELSE
        SELECT Seller_ID INTO v_seller_id FROM Products WHERE Product_ID = NEW.Product_ID;
    END IF;

    SELECT COALESCE(AVG(r.Rating), 0) INTO v_new_rating
    FROM Reviews r
    JOIN Products p ON r.Product_ID = p.Product_ID
    WHERE p.Seller_ID = v_seller_id;

    UPDATE Sellers SET Rating = ROUND(v_new_rating, 2) WHERE Seller_ID = v_seller_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$trg$;


DROP TRIGGER IF EXISTS trg_update_seller_rating ON Reviews;
CREATE TRIGGER trg_update_seller_rating
AFTER INSERT OR UPDATE OR DELETE ON Reviews
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating_on_review();


CREATE OR REPLACE PROCEDURE submit_review(
    p_customer_id UUID,
    p_product_id UUID,
    p_comment TEXT,
    p_rating INT,
    INOUT p_review_id UUID DEFAULT NULL
)
LANGUAGE plpgsql
AS $proc$
BEGIN
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM Order_Items oi
        JOIN Orders o ON oi.Order_ID = o.Order_ID
        WHERE o.Customer_ID = p_customer_id AND oi.Product_ID = p_product_id
    ) THEN
        RAISE EXCEPTION 'You can only review products you have purchased';
    END IF;

    IF EXISTS (
        SELECT 1 FROM Reviews
        WHERE Customer_ID = p_customer_id AND Product_ID = p_product_id
    ) THEN
        RAISE EXCEPTION 'You have already reviewed this product';
    END IF;

    INSERT INTO Reviews (Customer_ID, Product_ID, Comment_Body, Rating)
    VALUES (p_customer_id, p_product_id, p_comment, p_rating)
    RETURNING Review_ID INTO p_review_id;
END;
$proc$;


GRANT EXECUTE ON FUNCTION get_product_avg_rating(UUID) TO kanon;
GRANT EXECUTE ON FUNCTION update_seller_rating_on_review() TO kanon;
GRANT EXECUTE ON PROCEDURE submit_review(UUID, UUID, TEXT, INT, UUID) TO kanon;
