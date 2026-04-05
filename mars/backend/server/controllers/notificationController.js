const pool = require("../../../database/db");

exports.getNotifications = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;

    const result = await client.query(
      `SELECT
        Notification_ID AS notification_id,
        User_ID AS user_id,
        Message AS message,
        Is_Read AS is_read,
        Created_at AS created_at,
        Product_ID AS product_id,
        Order_ID AS order_id,
        COALESCE(
          Notification_Type,
          CASE
            WHEN Message ILIKE 'New order received%' THEN 'order'
            WHEN Message ILIKE 'A new question was asked%' THEN 'question'
            WHEN Message ILIKE 'A new review was posted%' THEN 'review'
            ELSE 'general'
          END
        ) AS notification_type
      FROM mars.Notifications
      WHERE User_ID = $1
      ORDER BY Created_at DESC
      LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};

exports.markAllAsRead = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;

    await client.query("BEGIN");

    await client.query(
      `UPDATE mars.Notifications
       SET Is_Read = TRUE
       WHERE User_ID = $1 AND Is_Read = FALSE`,
      [userId]
    );

    await client.query("COMMIT");

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};

exports.markAsRead = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE mars.Notifications
       SET Is_Read = TRUE
       WHERE User_ID = $1 AND Notification_ID = $2
       RETURNING *`,
      [userId, notificationId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Notification not found or access denied" });
    }

    await client.query("COMMIT");

    res.json({ message: "Notification marked as read", notification: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};
