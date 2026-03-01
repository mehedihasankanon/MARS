const pool = require("../../../database/db.js");

const USER_COLUMNS = `User_ID, Username, Email, First_Name, Last_Name, Phone_Number, Last_Login, Created_At`;

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.${USER_COLUMNS},
              CASE
                WHEN a.Admin_ID IS NOT NULL THEN 'admin'
                WHEN s.Seller_ID IS NOT NULL THEN 'seller'
                ELSE 'customer'
              END AS role
       FROM Users u
       LEFT JOIN Admins a ON u.User_ID = a.Admin_ID
       LEFT JOIN Sellers s ON u.User_ID = s.Seller_ID
       ORDER BY u.Created_At DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT ${USER_COLUMNS} FROM Users WHERE User_ID = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.${USER_COLUMNS},
              CASE
                WHEN a.Admin_ID IS NOT NULL THEN 'admin'
                WHEN s.Seller_ID IS NOT NULL THEN 'seller'
                ELSE 'customer'
              END AS role
       FROM Users u
       LEFT JOIN Admins a ON u.User_ID = a.Admin_ID
       LEFT JOIN Sellers s ON u.User_ID = s.Seller_ID
       WHERE u.User_ID = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
