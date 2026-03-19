const pool = require("../../../database/db");

exports.getNotifications = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;

    const result = await client.query(
      `SELECT * FROM mars.Notifications
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

    await client.query(
      `UPDATE mars.Notifications
       SET Is_Read = TRUE
       WHERE User_ID = $1 AND Is_Read = FALSE`,
      [userId]
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
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

    const result = await client.query(
      `UPDATE mars.Notifications
       SET Is_Read = TRUE
       WHERE User_ID = $1 AND Notification_ID = $2
       RETURNING *`,
      [userId, notificationId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found or access denied" });
    }

    res.json({ message: "Notification marked as read", notification: result.rows[0] });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } finally {
    client.release();
  }
};
