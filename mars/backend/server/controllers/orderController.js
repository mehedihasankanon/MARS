const pool = require("../../../database/db.js");

exports.getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT o.*,
            json_agg(json_build_object(
                'product_id', oi.Product_ID,
                'quantity', oi.quantity,
                'net_price', oi.Net_Price 
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
          'unit_price', pr.Unit_Price
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
      // Use the DB procedure for atomic cancellation (stock restore + payment void + shipment log)
      await pool.query("CALL mars.cancel_order($1, $2)", [orderId, req.user.userId]);
      return res.json({ message: "Order cancelled successfully" });
    }

    // For non-cancellation updates, keep lightweight SQL
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

      const result = await client.query(
        `UPDATE Orders SET Order_Status = $1 WHERE Order_ID = $2 RETURNING *`,
        [status, orderId],
      );

      const shipmentCheck = await client.query("SELECT Shipment_ID FROM Shipments WHERE Order_ID = $1", [orderId]);
      if (shipmentCheck.rows.length > 0) {
        await client.query(
          "INSERT INTO Shipment_Status_History (Shipment_ID, Status) VALUES ($1, $2)",
          [shipmentCheck.rows[0].shipment_id, `Status updated to: ${status}`]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Order status updated", order: result.rows[0] });
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

exports.placeOrder = async (req, res) => {
  const customerId = req.user.userId;
  const { Items, addressId, couponId, deliveryFee, paymentMethod } = req.body;

  try {
    // If Items are passed (from frontend), we need to add them to cart first
    // since the procedure works from the cart. But the cart should already have
    // items from the normal checkout flow. We just call the procedure.
    await pool.query(
      "CALL mars.place_order($1, $2, $3, $4, $5)",
      [
        customerId,
        addressId,
        couponId || null,
        deliveryFee || 0,
        paymentMethod || "Cash on Delivery",
      ]
    );

    res.status(201).json({ message: "Order placed successfully" });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

