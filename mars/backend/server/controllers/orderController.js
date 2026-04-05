const pool = require("../../../database/db.js");

exports.getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT o.*,
            json_agg(json_build_object(
                'product_id', oi.Product_ID,
                'quantity', oi.quantity,
                'net_price', oi.Net_Price,
                'item_status', oi.Item_Status,
                'delivered_confirmed', oi.Delivered_Confirmed
            )) as items,
            p.Payment_Method as payment_method,
            p.Payment_Status as payment_status,
            p.Payment_Date as payment_date

            FROM Orders o
            JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
            LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
            WHERE o.Customer_ID = $1
            GROUP BY o.Order_ID, p.Payment_Method, p.Payment_Status, p.Payment_Date
            ORDER BY o.Order_Date DESC
            `,
      [req.user.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.Order_ID,
        o.Order_Date,
        o.Order_Status,
        o.Total_Amount,
        u.Username as customer_name,
        json_agg(json_build_object(
          'product_id', oi.Product_ID,
          'product_name', pr.Name,
          'quantity', oi.Quantity,
          'net_price', oi.Net_Price,
          'unit_price', pr.Unit_Price,
          'item_status', oi.Item_Status,
          'delivered_confirmed', oi.Delivered_Confirmed,
          'has_delivery_issue', EXISTS (
            SELECT 1
            FROM mars.Delivery_Issues di
            WHERE di.Order_ID = oi.Order_ID
              AND di.Product_ID = oi.Product_ID
              AND di.Received_OK = FALSE
          )
        )) as items,
        p.Payment_Method as payment_method,
        p.Payment_Status as payment_status
      FROM Orders o
      JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
      JOIN Products pr ON pr.Product_ID = oi.Product_ID
      JOIN Sellers s ON s.Seller_ID = pr.Seller_ID
      JOIN Users u ON u.User_ID = o.Customer_ID
      LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
      WHERE s.Seller_ID = $1
      GROUP BY o.Order_ID, o.Order_Date, o.Order_Status, o.Total_Amount,
               u.Username, p.Payment_Method, p.Payment_Status
      ORDER BY o.Order_Date DESC
      `,
      [req.user.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  try {
    if (status === "Cancelled") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("CALL mars.cancel_order($1, $2)", [orderId, req.user.userId]);
        await client.query("COMMIT");
        return res.json({ message: "Order cancelled successfully" });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const check = await client.query(
        `SELECT 1 FROM Order_Items oi
         JOIN Products pr ON pr.Product_ID = oi.Product_ID
         WHERE oi.Order_ID = $1 AND pr.Seller_ID = $2
         LIMIT 1`,
        [orderId, req.user.userId],
      );

      if (check.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Not authorized to update this order" });
      }

      const sellerItems = await client.query(
        `SELECT oi.Product_ID
         FROM Order_Items oi
         JOIN Products pr ON pr.Product_ID = oi.Product_ID
         WHERE oi.Order_ID = $1 AND pr.Seller_ID = $2`,
        [orderId, req.user.userId],
      );

      for (const row of sellerItems.rows) {
        await client.query(
          `UPDATE Order_Items
           SET Item_Status = $1
           WHERE Order_ID = $2 AND Product_ID = $3`,
          [status, orderId, row.product_id],
        );
      }

      const result = await client.query(`SELECT * FROM Orders WHERE Order_ID = $1`, [orderId]);

      const shipmentCheck = await client.query("SELECT Shipment_ID FROM Shipments WHERE Order_ID = $1", [orderId]);
      if (shipmentCheck.rows.length > 0) {
        await client.query(
          "INSERT INTO Shipment_Status_History (Shipment_ID, Status) VALUES ($1, $2)",
          [shipmentCheck.rows[0].shipment_id, `Status updated to: ${status}`]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Order item status updated", order: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

exports.updateOrderItemStatus = async (req, res) => {
  const { orderId, productId } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sellerId = req.user.userId;

    const ownerCheck = await client.query(
      `SELECT 1
       FROM Order_Items oi
       JOIN Products pr ON pr.Product_ID = oi.Product_ID
       WHERE oi.Order_ID = $1 AND oi.Product_ID = $2 AND pr.Seller_ID = $3
       LIMIT 1`,
      [orderId, productId, sellerId],
    );
    if (ownerCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Not authorized to update this item" });
    }

    await client.query(
      `UPDATE Order_Items
       SET Item_Status = $1
       WHERE Order_ID = $2 AND Product_ID = $3`,
      [status, orderId, productId],
    );

    // If delivered, notify the customer to confirm delivery
    if (status === "Delivered") {
      const orderRes = await client.query(
        "SELECT Customer_ID FROM Orders WHERE Order_ID = $1",
        [orderId],
      );
      const productRes = await client.query(
        "SELECT Name, Seller_ID FROM Products WHERE Product_ID = $1",
        [productId],
      );

      if (orderRes.rows[0] && productRes.rows[0]) {
        const customerId = orderRes.rows[0].customer_id;
        const productName = productRes.rows[0].name;
        await client.query(
          `INSERT INTO mars.Notifications (User_ID, Message, Product_ID, Order_ID, Notification_Type)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            customerId,
            `Your order item "${productName}" was marked Delivered. Please confirm if you received it properly.`,
            productId,
            orderId,
            "delivery_confirm",
          ],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Item status updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating item status:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.confirmDelivery = async (req, res) => {
  const { orderId, productId } = req.params;
  const { receivedOk, feedback } = req.body;

  if (typeof receivedOk !== "boolean") {
    return res.status(400).json({ error: "receivedOk must be a boolean" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customerId = req.user.userId;
    const orderCheck = await client.query(
      "SELECT Customer_ID FROM Orders WHERE Order_ID = $1",
      [orderId],
    );
    if (orderCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    if (orderCheck.rows[0].customer_id !== customerId && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Forbidden" });
    }

    const itemRes = await client.query(
      `SELECT oi.Item_Status, p.Seller_ID
       FROM Order_Items oi
       JOIN Products p ON p.Product_ID = oi.Product_ID
       WHERE oi.Order_ID = $1 AND oi.Product_ID = $2`,
      [orderId, productId],
    );
    if (itemRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order item not found" });
    }
    if (itemRes.rows[0].item_status !== "Delivered") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Item is not marked Delivered yet" });
    }

    await client.query(
      `UPDATE Order_Items
       SET Delivered_Confirmed = TRUE
       WHERE Order_ID = $1 AND Product_ID = $2`,
      [orderId, productId],
    );

    if (!receivedOk) {
      const sellerId = itemRes.rows[0].seller_id;
      await client.query(
        `INSERT INTO mars.Delivery_Issues (Order_ID, Product_ID, Customer_ID, Seller_ID, Received_OK, Feedback)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, productId, customerId, sellerId, false, feedback || null],
      );

      const productNameRes = await client.query(
        "SELECT Name FROM Products WHERE Product_ID = $1",
        [productId],
      );
      const productName = productNameRes.rows[0]?.name || "a product";
      const msg = `Delivery issue: a customer reported they did not receive "${productName}" properly for order #${String(orderId).slice(0, 8)}. Check Delivery issues on your Orders tab.`;
      await client.query(
        `INSERT INTO mars.Notifications (User_ID, Message, Product_ID, Order_ID, Notification_Type)
         VALUES ($1, $2, $3, $4, $5)`,
        [sellerId, msg, productId, orderId, "delivery_issue"],
      );
    }

    await client.query(
      `UPDATE mars.Notifications
       SET Is_Read = TRUE
       WHERE User_ID = $1 AND Order_ID = $2 AND Product_ID = $3 AND Notification_Type = 'delivery_confirm'`,
      [customerId, orderId, productId],
    );

    await client.query("COMMIT");
    res.json({ message: "Delivery confirmation saved" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error confirming delivery:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.getSellerDeliveryIssues = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const result = await pool.query(
      `SELECT di.*,
              u.Username AS customer_name,
              p.Name AS product_name
       FROM mars.Delivery_Issues di
       JOIN mars.Users u ON u.User_ID = di.Customer_ID
       JOIN mars.Products p ON p.Product_ID = di.Product_ID
       WHERE di.Seller_ID = $1
       ORDER BY di.Created_at DESC
       LIMIT 100`,
      [sellerId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching delivery issues:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.placeOrder = async (req, res) => {
  const customerId = req.user.userId;
  const { Items, addressId, couponId, deliveryFee, paymentMethod } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CALL mars.place_order($1, $2, $3, $4, $5)",
      [
        customerId,
        addressId,
        couponId || null,
        deliveryFee || 0,
        paymentMethod || "Cash on Delivery",
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Order placed successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error placing order:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

