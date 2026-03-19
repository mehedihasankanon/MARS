const pool = require("../../../database/db");

exports.getPaymentByOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const orderCheck = await client.query(
      `SELECT Customer_ID FROM Orders WHERE Order_ID = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderCheck.rows[0].customer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }

    const paymentResult = await client.query(
      `SELECT * FROM Payments WHERE Order_ID = $1`,
      [orderId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found for this order" });
    }

    res.json(paymentResult.rows[0]);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { paymentId } = req.params;
    const { status } = req.body; 
    
    const updateResult = await client.query(
      `UPDATE Payments SET Payment_Status = $1, Payment_Date = CURRENT_TIMESTAMP WHERE Payment_ID = $2 RETURNING *`,
      [status, paymentId]
    );

    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    await client.query("COMMIT");
    res.json({ message: "Payment status updated", payment: updateResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
