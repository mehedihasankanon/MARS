# ADVANCED QUERIES (total - 17)

### 1. `getTopSellers`
```sql
SELECT
  u.Username AS seller_name,
  u.Profile_Picture AS profile_picture,
  s.Rating AS seller_rating,
  COUNT(DISTINCT o.Order_ID) AS total_orders,
  COUNT(DISTINCT p.Product_ID) AS total_products,
  SUM(oi.Net_Price) AS total_revenue,
  ROUND(AVG(r.Rating), 2) AS avg_product_rating
FROM
  Sellers s
  JOIN Users u ON s.Seller_ID = u.User_ID
  JOIN Products p ON p.Seller_ID = s.Seller_ID
  LEFT JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
  LEFT JOIN Orders o ON o.Order_ID = oi.Order_ID
  AND o.Order_Status != 'Cancelled'
  LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
GROUP BY
  s.Seller_ID,
  u.Username,
  u.Profile_Picture,
  s.Rating
HAVING
  COUNT(DISTINCT oi.Order_ID) > 0
ORDER BY
  total_revenue DESC NULLS LAST
LIMIT
  10;
```

### 2. `getBestSellingProducts`
```sql
SELECT
  p.Product_ID AS product_id,
  p.Name AS product_name,
  c.Name AS category_name,
  u.Username AS seller_name,
  SUM(oi.Quantity) AS total_sold,
  SUM(oi.Net_Price) AS total_revenue,
  ROUND(AVG(r.Rating), 2) AS avg_rating,
  COUNT(DISTINCT r.Review_ID) AS review_count,
  (
    SELECT
      pi.Image_URL
    FROM
      Product_Images pi
    WHERE
      pi.Product_ID = p.Product_ID
    LIMIT
      1
  ) AS image_url
FROM
  Products p
  JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
  JOIN Orders o ON o.Order_ID = oi.Order_ID
  AND o.Order_Status != 'Cancelled'
  JOIN Categories c ON c.Category_ID = p.Category_ID
  JOIN Users u ON u.User_ID = p.Seller_ID
  LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
GROUP BY
  p.Product_ID,
  p.Name,
  c.Name,
  u.Username
ORDER BY
  total_sold DESC
LIMIT
  10;
```

### 3. `getCategoryAnalytics`
```sql
SELECT
  c.Category_ID AS category_id,
  c.Name AS category_name,
  COUNT(DISTINCT p.Product_ID) AS product_count,
  COUNT(
    DISTINCT CASE
      WHEN o.Order_Status != 'Cancelled' THEN o.Order_ID
    END
  ) AS total_orders,
  COALESCE(
    SUM(
      CASE
        WHEN o.Order_Status != 'Cancelled' THEN oi.Net_Price
      END
    ),
    0
  ) AS total_revenue,
  COALESCE(
    SUM(
      CASE
        WHEN o.Order_Status != 'Cancelled' THEN oi.Quantity
      END
    ),
    0
  ) AS items_sold,
  ROUND(AVG(r.Rating), 2) AS avg_rating
FROM
  Categories c
  LEFT JOIN Products p ON p.Category_ID = c.Category_ID
  LEFT JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
  LEFT JOIN Orders o ON o.Order_ID = oi.Order_ID
  LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
GROUP BY
  c.Category_ID,
  c.Name
ORDER BY
  total_revenue DESC;
```

### 4. `getPlatformStats`
```sql
SELECT
  (SELECT COUNT(*) FROM Users) AS total_users,
  (SELECT COUNT(*) FROM Sellers) AS total_sellers,
  (SELECT COUNT(*) FROM Products) AS total_products,
  (
    SELECT COUNT(*) FROM Orders 
    WHERE Order_Status != 'Cancelled'
  ) AS total_orders,
  (
    SELECT COALESCE(SUM(Total_Amount), 0) FROM Orders 
    WHERE Order_Status != 'Cancelled'
  ) AS total_revenue,
  (SELECT COUNT(*) FROM Reviews) AS total_reviews,
  (SELECT ROUND(AVG(Rating), 2) FROM Reviews) AS platform_avg_rating,
  (
    SELECT COUNT(*) FROM Orders 
    WHERE Order_Status = 'Pending'
  ) AS pending_orders,
  (
    SELECT COUNT(*) FROM Orders 
    WHERE Order_Status = 'Delivered'
  ) AS delivered_orders,
  (
    SELECT COUNT(*) FROM Returns 
    WHERE Status = 'Pending'
  ) AS pending_returns;
```

### 5. `getCartItems`
```sql
SELECT
  c.*,
  json_agg(
    json_build_object(
      'product_id', ci.Product_ID,
      'quantity', ci.Quantity,
      'net_price', ci.Net_Price
    )
  ) FILTER (
    WHERE
      ci.Product_ID IS NOT NULL
  ) AS items
FROM
  carts c
  LEFT JOIN Cart_items ci ON c.Cart_ID = ci.Cart_ID
WHERE
  c.Customer_ID = $1
GROUP BY
  c.Cart_ID;
```

### 6. `getMyOrders`
```sql
SELECT
  o.*,
  json_agg(
    json_build_object(
      'product_id', oi.Product_ID,
      'quantity', oi.quantity,
      'net_price', oi.Net_Price,
      'item_status', oi.Item_Status,
      'delivered_confirmed', oi.Delivered_Confirmed
    )
  ) AS items,
  p.Payment_Method AS payment_method,
  p.Payment_Status AS payment_status,
  p.Payment_Date AS payment_date
FROM
  Orders o
  JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
  LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
WHERE
  o.Customer_ID = $1
GROUP BY
  o.Order_ID,
  p.Payment_Method,
  p.Payment_Status,
  p.Payment_Date
ORDER BY
  o.Order_Date DESC;
```

### 7. `getSellerOrders`
```sql
SELECT
  o.Order_ID,
  o.Order_Date,
  o.Order_Status,
  o.Total_Amount,
  u.Username AS customer_name,
  json_agg(
    json_build_object(
      'product_id', oi.Product_ID,
      'product_name', pr.Name,
      'quantity', oi.Quantity,
      'net_price', oi.Net_Price,
      'unit_price', pr.Unit_Price,
      'item_status', oi.Item_Status,
      'delivered_confirmed', oi.Delivered_Confirmed
    )
  ) AS items,
  p.Payment_Method AS payment_method,
  p.Payment_Status AS payment_status
FROM
  Orders o
  JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
  JOIN Products pr ON pr.Product_ID = oi.Product_ID
  JOIN Sellers s ON s.Seller_ID = pr.Seller_ID
  JOIN Users u ON u.User_ID = o.Customer_ID
  LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
WHERE
  s.Seller_ID = $1
GROUP BY
  o.Order_ID,
  o.Order_Date,
  o.Order_Status,
  o.Total_Amount,
  u.Username,
  p.Payment_Method,
  p.Payment_Status
ORDER BY
  o.Order_Date DESC;
```

### 8. `updateOrderStatus`
**Atomic Cancellation:**
```sql
CALL mars.cancel_order($1, $2);
```
**Status Update Logic:**
```sql
-- Authorization Check
SELECT
  1
FROM
  Order_Items oi
  JOIN Products pr ON pr.Product_ID = oi.Product_ID
WHERE
  oi.Order_ID = $1
  AND pr.Seller_ID = $2
LIMIT
  1;

-- Fetch Seller Items
SELECT
  oi.Product_ID
FROM
  Order_Items oi
  JOIN Products pr ON pr.Product_ID = oi.Product_ID
WHERE
  oi.Order_ID = $1
  AND pr.Seller_ID = $2;

-- Update Item Status
UPDATE
  Order_Items
SET
  Item_Status = $1
WHERE
  Order_ID = $2
  AND Product_ID = $3;

-- Log Shipment History
INSERT INTO Shipment_Status_History (Shipment_ID, Status)
VALUES
  ($1, $2);
```

### 9. `updateOrderItemStatus`
```sql
-- Ownership Check
SELECT
  1
FROM
  Order_Items oi
  JOIN Products pr ON pr.Product_ID = oi.Product_ID
WHERE
  oi.Order_ID = $1
  AND oi.Product_ID = $2
  AND pr.Seller_ID = $3
LIMIT
  1;

-- Update Status
UPDATE
  Order_Items
SET
  Item_Status = $1
WHERE
  Order_ID = $2
  AND Product_ID = $3;

-- Notification Logic (If Delivered)
INSERT INTO mars.Notifications (
  User_ID,
  Message,
  Product_ID,
  Order_ID,
  Notification_Type
)
VALUES
  ($1, $2, $3, $4, $5);
```

### 10. `confirmDelivery`
```sql
-- Update Confirmation
UPDATE
  Order_Items
SET
  Delivered_Confirmed = TRUE
WHERE
  Order_ID = $1
  AND Product_ID = $2;

-- Log Issue (If receivedOk is false)
INSERT INTO mars.Delivery_Issues (
  Order_ID,
  Product_ID,
  Customer_ID,
  Seller_ID,
  Received_OK,
  Feedback
)
VALUES
  ($1, $2, $3, $4, $5, $6);

-- Mark Notification as Read
UPDATE
  mars.Notifications
SET
  Is_Read = TRUE
WHERE
  User_ID = $1
  AND Order_ID = $2
  AND Product_ID = $3
  AND Notification_Type = 'delivery_confirm';
```

### 11. `getSellerDeliveryIssues`
```sql
SELECT
  di.*,
  u.Username AS customer_name,
  p.Name AS product_name
FROM
  mars.Delivery_Issues di
  JOIN mars.Users u ON u.User_ID = di.Customer_ID
  JOIN mars.Products p ON p.Product_ID = di.Product_ID
WHERE
  di.Seller_ID = $1
ORDER BY
  di.Created_at DESC
LIMIT
  100;
```

### 12. `getAllProducts`
*(Note: This query is dynamically constructed based on filters like category, search, and seller.)*
```sql
SELECT
  p.Product_ID,
  p.Seller_ID,
  p.Category_ID,
  p.Name,
  p.Description,
  p.Adding_Date,
  p.Stock_Quantity,
  p.Condition_State,
  p.Unit_Price AS original_price,
  COALESCE(
    (
      SELECT
        po.Offer_Percent
      FROM
        Product_Offers po
      WHERE
        po.Product_ID = p.Product_ID
        AND NOW() >= po.Start_Date
        AND NOW() <= po.Expiry_Date
      ORDER BY
        po.Offer_Percent DESC
      LIMIT
        1
    ),
    0
  ) AS discount_percent,
  (
    p.Unit_Price * (
      1 - COALESCE(
        (
          SELECT
            po.Offer_Percent
          FROM
            Product_Offers po
          WHERE
            po.Product_ID = p.Product_ID
            AND NOW() >= po.Start_Date
            AND NOW() <= po.Expiry_Date
          ORDER BY
            po.Offer_Percent DESC
          LIMIT
            1
        ),
        0
      ) / 100.0
    )
  ) AS unit_price,
  c.Name AS category_name,
  u.Username AS seller_name,
  s.Rating AS seller_rating,
  COALESCE(
    (
      SELECT
        json_agg(
          json_build_object(
            'image_id', pi.Image_ID,
            'image_url', pi.Image_URL
          )
        )
      FROM
        Product_Images pi
      WHERE
        pi.Product_ID = p.Product_ID
    ),
    '[]'
  ) AS images,
  get_product_avg_rating(p.Product_ID) AS avg_rating,
  (
    SELECT
      COUNT(*)
    FROM
      Reviews r
    WHERE
      r.Product_ID = p.Product_ID
  ) AS review_count,
  (
    SELECT
      COALESCE(SUM(oi.Quantity), 0)
    FROM
      Order_Items oi
    WHERE
      oi.Product_ID = p.Product_ID
  ) AS order_count
FROM
  products p
  JOIN Categories c ON p.Category_ID = c.Category_ID
  JOIN Sellers s ON p.Seller_ID = s.Seller_ID
  JOIN Users u ON s.seller_id = u.User_ID
/* Dynamic WHERE Clause */
/* Dynamic ORDER BY Clause */;
```

### 13. `getProductById`
```sql
SELECT
  p.Product_ID,
  p.Seller_ID,
  p.Category_ID,
  p.Name,
  p.Description,
  p.Adding_Date,
  p.Stock_Quantity,
  p.Condition_State,
  p.Unit_Price AS original_price,
  COALESCE(
    (
      SELECT
        po.Offer_Percent
      FROM
        Product_Offers po
      WHERE
        po.Product_ID = p.Product_ID
        AND NOW() >= po.Start_Date
        AND NOW() <= po.Expiry_Date
      ORDER BY
        po.Offer_Percent DESC
      LIMIT
        1
    ),
    0
  ) AS discount_percent,
  (
    p.Unit_Price * (
      1 - COALESCE(
        (
          SELECT
            po.Offer_Percent
          FROM
            Product_Offers po
          WHERE
            po.Product_ID = p.Product_ID
            AND NOW() >= po.Start_Date
            AND NOW() <= po.Expiry_Date
          ORDER BY
            po.Offer_Percent DESC
          LIMIT
            1
        ),
        0
      ) / 100.0
    )
  ) AS unit_price,
  c.Name AS category_name,
  u.Username AS seller_name,
  s.Rating AS seller_rating,
  COALESCE(
    (
      SELECT
        json_agg(
          json_build_object(
            'image_id', pi.Image_ID,
            'image_url', pi.Image_URL
          )
        )
      FROM
        Product_Images pi
      WHERE
        pi.Product_ID = p.Product_ID
    ),
    '[]'
  ) AS images,
  get_product_avg_rating(p.Product_ID) AS avg_rating,
  (
    SELECT
      COUNT(*)
    FROM
      Reviews r
    WHERE
      r.Product_ID = p.Product_ID
  ) AS review_count
FROM
  products p
  JOIN Categories c ON p.Category_ID = c.Category_ID
  JOIN Sellers s ON p.Seller_ID = s.Seller_ID
  JOIN Users u ON s.seller_id = u.User_ID
WHERE
  p.Product_ID = $1;
```

### 14. `getSellerReturns`
```sql
SELECT
  r.Return_ID AS return_id,
  r.Order_ID AS order_id,
  r.Customer_ID AS customer_id,
  r.Reason AS reason,
  r.Status AS status,
  r.Refund_Amount AS refund_amount,
  r.Return_Date AS return_date,
  u.Username AS customer_name,
  COALESCE(
    (
      SELECT
        json_agg(ri_img.image_url ORDER BY ri_img.image_url)
      FROM
        mars.Return_Images ri_img
      WHERE
        ri_img.Return_ID = r.Return_ID
    ),
    '[]' :: json
  ) AS image_urls
FROM
  Returns r
  JOIN Return_Items ri ON r.Return_ID = ri.Return_ID
  JOIN Products p ON ri.Product_ID = p.Product_ID
  JOIN Users u ON r.Customer_ID = u.User_ID
WHERE
  p.Seller_ID = $1
GROUP BY
  r.Return_ID,
  r.Order_ID,
  r.Customer_ID,
  r.Reason,
  r.Status,
  r.Refund_Amount,
  r.Return_Date,
  u.Username
ORDER BY
  r.Return_Date DESC;
```

### 15. `getProductReviews`
```sql
SELECT
  r.Review_ID AS review_id,
  r.Comment_Body AS comment,
  r.Rating AS rating,
  r.Review_Date AS review_date,
  u.Username AS username,
  u.Profile_Picture AS profile_picture,
  EXISTS (
    SELECT
      1
    FROM
      Order_Items oi
      JOIN Orders o ON oi.Order_ID = o.Order_ID
    WHERE
      o.Customer_ID = r.Customer_ID
      AND oi.Product_ID = r.Product_ID
      AND o.Order_Status = 'Delivered'
  ) AS verified
FROM
  Reviews r
  JOIN Users u ON r.Customer_ID = u.User_ID
WHERE
  r.Product_ID = $1
ORDER BY
  r.Review_Date DESC;
```

### 16. `getAllUsers`
```sql
SELECT
  u.User_ID,
  u.Username,
  u.Email,
  u.First_Name,
  u.Last_Name,
  u.Phone_Number,
  u.Profile_Picture,
  u.Last_Login,
  u.Created_At,
  CASE
    WHEN a.Admin_ID IS NOT NULL THEN 'admin'
    WHEN s.Seller_ID IS NOT NULL THEN 'seller'
    ELSE 'customer'
  END AS role
FROM
  Users u
  LEFT JOIN Admins a ON u.User_ID = a.Admin_ID
  LEFT JOIN Sellers s ON u.User_ID = s.Seller_ID
ORDER BY
  u.Created_At DESC;
```

### 17. `getProfile`
```sql
SELECT
  u.User_ID,
  u.Username,
  u.Email,
  u.First_Name,
  u.Last_Name,
  u.Phone_Number,
  u.Profile_Picture,
  u.Last_Login,
  u.Created_At,
  CASE
    WHEN a.Admin_ID IS NOT NULL THEN 'admin'
    WHEN s.Seller_ID IS NOT NULL THEN 'seller'
    ELSE 'customer'
  END AS role,
  s.Rating AS seller_rating,
  s.Shop_Name AS shop_name
FROM
  Users u
  LEFT JOIN Admins a ON u.User_ID = a.Admin_ID
  LEFT JOIN Sellers s ON u.User_ID = s.Seller_ID
WHERE
  u.User_ID = $1;
```



---

# DATABASE FUNCTIONS, PROCEDURES, AND TRIGGERS (total - 10)

### Function: `add_to_cart`
```sql
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
```

### Function: `get_product_stats`
```sql
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
```

### Function: `notify_seller_on_order`
```sql
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

  INSERT INTO mars.Notifications (User_ID, Message, Product_ID, Order_ID, Notification_Type)
  VALUES (
    v_seller_id,
    'New order received for your product: ' || v_product_name || ' (Qty: ' || NEW.Quantity || ')',
    NEW.Product_ID,
    NEW.Order_ID,
    'order'
  );

  RETURN NEW;
END;
$$;
```

### Function: `notify_seller_on_question`
```sql
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

  INSERT INTO mars.Notifications (User_ID, Message, Product_ID, Notification_Type)
  VALUES (
    v_seller_id,
    'A new question was asked on your product: ' || v_product_name,
    NEW.Product_ID,
    'question'
  );

  RETURN NEW;
END;
$$;
```

### Function: `notify_seller_on_review`
```sql
CREATE OR REPLACE FUNCTION mars.notify_seller_on_review()
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

  INSERT INTO mars.Notifications (User_ID, Message, Product_ID, Notification_Type)
  VALUES (
    v_seller_id,
    'A new review was posted on your product: ' || v_product_name || ' (Rating: ' || NEW.Rating || '/5)',
    NEW.Product_ID,
    'review'
  );

  RETURN NEW;
END;
$$;
```

### Function: `recompute_order_status`
```sql
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
```

### Function: `request_return_returning`
```sql
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
```

### Function: `trg_recompute_order_status`
```sql
CREATE OR REPLACE FUNCTION mars.trg_recompute_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM mars.recompute_order_status(COALESCE(NEW.Order_ID, OLD.Order_ID));
  RETURN COALESCE(NEW, OLD);
END;
$$;
```

### Function: `update_seller_rating`
```sql
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
```

### Procedure: `approve_return`
```sql
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
```

### Procedure: `cancel_order`
```sql
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
```

### Procedure: `place_order`
```sql
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
```

### Procedure: `request_return`
```sql
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
```

### Trigger: `trg_notify_seller_on_order`
```sql
CREATE TRIGGER trg_notify_seller_on_order
AFTER INSERT ON mars.Order_Items
FOR EACH ROW
EXECUTE FUNCTION mars.notify_seller_on_order();
```

### Trigger: `trg_notify_seller_on_question`
```sql
CREATE TRIGGER trg_notify_seller_on_question
AFTER INSERT ON mars.Questions
FOR EACH ROW
EXECUTE FUNCTION mars.notify_seller_on_question();
```

### Trigger: `trg_notify_seller_on_review`
```sql
CREATE TRIGGER trg_notify_seller_on_review
AFTER INSERT ON mars.Reviews
FOR EACH ROW
EXECUTE FUNCTION mars.notify_seller_on_review();
```

### Trigger: `trg_recompute_order_status`
```sql
CREATE TRIGGER trg_recompute_order_status
AFTER UPDATE OF Item_Status ON mars.Order_Items
FOR EACH ROW
EXECUTE FUNCTION mars.trg_recompute_order_status();
```

### Trigger: `trg_update_seller_rating`
```sql
CREATE TRIGGER trg_update_seller_rating
AFTER INSERT OR DELETE ON mars.Reviews
FOR EACH ROW
EXECUTE FUNCTION mars.update_seller_rating();
```

