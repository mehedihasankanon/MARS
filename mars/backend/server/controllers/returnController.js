const pool = require("../../../database/db");

exports.requestReturn = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { orderId, reason } = req.body;
    const customerId = req.user.userId;

    if (!orderId || !reason) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Order ID and reason are required" });
    }

    const returnIdResult = await client.query(
      "SELECT mars.request_return_returning($1, $2, $3) AS return_id",
      [orderId, customerId, reason],
    );
    const returnId = returnIdResult.rows[0]?.return_id;

    if (!returnId) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to create return request" });
    }

    const files = req.files || [];
    if (files.length > 0) {
      for (const file of files) {
        await client.query(
          "INSERT INTO mars.Return_Images (Return_ID, Image_URL) VALUES ($1, $2)",
          [returnId, file.path],
        );
      }
    }

    const sellersRes = await client.query(
      `SELECT DISTINCT ON (p.Seller_ID) p.Seller_ID AS seller_id, p.Name AS product_name
       FROM mars.Return_Items ri
       JOIN mars.Products p ON p.Product_ID = ri.Product_ID
       WHERE ri.Return_ID = $1
       ORDER BY p.Seller_ID, p.Name`,
      [returnId],
    );

    for (const row of sellersRes.rows) {
      await client.query(
        `INSERT INTO mars.Notifications (User_ID, Message, Order_ID, Notification_Type)
         VALUES ($1, $2, $3, $4)`,
        [
          row.seller_id,
          `Return requested: a customer submitted a return for "${row.product_name}" (order #${String(orderId).slice(0, 8)}). Review it in Dashboard → Returns.`,
          orderId,
          "return_request",
        ],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Return requested successfully", return_id: returnId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error requesting return:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.approveReturn = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { returnId } = req.params;

    await client.query("CALL mars.approve_return($1)", [returnId]);

    await client.query("COMMIT");
    res.json({ message: "Return approved and inventory refunded successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving return:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.getSellerReturns = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    // Fetch return requests mapped back to products owned by this specific seller
    const result = await pool.query(
      `
      SELECT r.Return_ID AS return_id, r.Order_ID AS order_id, r.Customer_ID AS customer_id,
             r.Reason AS reason, r.Status AS status, r.Refund_Amount AS refund_amount,
             r.Return_Date AS return_date, u.Username AS customer_name,
             COALESCE(
               (SELECT json_agg(ri_img.image_url ORDER BY ri_img.image_url)
                FROM mars.Return_Images ri_img
                WHERE ri_img.Return_ID = r.Return_ID),
               '[]'::json
             ) AS image_urls
      FROM Returns r
      JOIN Return_Items ri ON r.Return_ID = ri.Return_ID
      JOIN Products p ON ri.Product_ID = p.Product_ID
      JOIN Users u ON r.Customer_ID = u.User_ID
      WHERE p.Seller_ID = $1
      GROUP BY r.Return_ID, r.Order_ID, r.Customer_ID, r.Reason, r.Status,
               r.Refund_Amount, r.Return_Date, u.Username
      ORDER BY r.Return_Date DESC
    `,
      [sellerId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching returns:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
