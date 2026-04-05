const pool = require("../../../database/db");

exports.reportScam = async (req, res) => {
  const { orderId, productId, accusedSellerId, description } = req.body;
  const reporterCustomerId = req.user.userId;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: "Description is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure reporter is a customer (or admin acting on behalf)
    const customerCheck = await client.query(
      "SELECT 1 FROM Customers WHERE Customer_ID = $1",
      [reporterCustomerId],
    );
    if (customerCheck.rows.length === 0 && req.user.role !== "admin") {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Only customers can report scams" });
    }

    if (orderId) {
      const orderCheck = await client.query(
        "SELECT 1 FROM Orders WHERE Order_ID = $1 AND Customer_ID = $2",
        [orderId, reporterCustomerId],
      );
      if (orderCheck.rows.length === 0 && req.user.role !== "admin") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Order is invalid or does not belong to you" });
      }
    }

    let finalAccusedSellerId = accusedSellerId || null;
    if (productId && !finalAccusedSellerId) {
      const pr = await client.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [productId],
      );
      finalAccusedSellerId = pr.rows[0]?.seller_id || null;
    }

    const insert = await client.query(
      `INSERT INTO mars.Scam_Reports
        (Reporter_Customer_ID, Accused_Seller_ID, Order_ID, Product_ID, Description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING Report_ID`,
      [
        reporterCustomerId,
        finalAccusedSellerId,
        orderId || null,
        productId || null,
        description.trim(),
      ],
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Scam report submitted", report_id: insert.rows[0].report_id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error reporting scam:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.getScamReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*,
              u.Username AS reporter_username,
              au.Username AS accused_seller_username,
              p.Name AS product_name
       FROM mars.Scam_Reports sr
       JOIN mars.Users u ON u.User_ID = sr.Reporter_Customer_ID
       LEFT JOIN mars.Users au ON au.User_ID = sr.Accused_Seller_ID
       LEFT JOIN mars.Products p ON p.Product_ID = sr.Product_ID
       ORDER BY sr.Created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching scam reports:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateScamReportStatus = async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body;
  const valid = ["Open", "Under Review", "Resolved", "Dismissed"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      `UPDATE mars.Scam_Reports
       SET Status = $1
       WHERE Report_ID = $2
       RETURNING *`,
      [status, reportId],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Status updated", report: result.rows[0] });
  } catch (err) {
    console.error("Error updating scam report:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

