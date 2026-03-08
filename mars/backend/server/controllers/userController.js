const pool = require("../../../database/db.js");
const { cloudinary } = require("../config/cloudinary.js");

const USER_COLUMNS = `User_ID, Username, Email, First_Name, Last_Name, Phone_Number, Profile_Picture, Last_Login, Created_At`;

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
              END AS role,
              s.Rating as seller_rating,
              s.Shop_Name as shop_name
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

exports.becomeSeller = async (req, res) => {
  const userId = req.user.userId;
  const { shopName } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sellerCheck = await client.query(
      "SELECT * FROM Sellers WHERE Seller_ID = $1",
      [userId]
    );
    if (sellerCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "You are already a seller" });
    }

    const customerCheck = await client.query(
      "SELECT * FROM Customers WHERE Customer_ID = $1",
      [userId]
    );
    if (customerCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Only customers can become sellers" });
    }

    await client.query(
      "INSERT INTO Sellers (Seller_ID, Shop_Name) VALUES ($1, $2)",
      [userId, shopName || null]
    );

    await client.query("COMMIT");

    const jwt = require("jsonwebtoken");
    const { JWT_SECRET } = require("../middleware/jwt.js");
    const token = jwt.sign({ userId, role: "seller" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "You are now a seller! You can start listing products.",
      token,
      role: "seller",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.uploadProfilePicture = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (!req.file) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No image file provided" });
    }

    const userId = req.user.userId;

    const existing = await client.query(
      "SELECT Profile_Picture FROM Users WHERE User_ID = $1",
      [userId]
    );
    if (existing.rows[0]?.profile_picture) {
      const oldUrl = existing.rows[0].profile_picture;
      const parts = oldUrl.split("/");
      const folderAndFile = parts.slice(parts.indexOf("mars")).join("/");
      const publicId = folderAndFile.replace(/\.[^.]+$/, "");
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    const imageUrl = req.file.path;

    await client.query(
      "UPDATE Users SET Profile_Picture = $1 WHERE User_ID = $2",
      [imageUrl, userId]
    );

    await client.query("COMMIT");
    res.json({ message: "Profile picture updated", profile_picture: imageUrl });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.removeProfilePicture = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userId = req.user.userId;

    const existing = await client.query(
      "SELECT Profile_Picture FROM Users WHERE User_ID = $1",
      [userId]
    );
    if (existing.rows[0]?.profile_picture) {
      const oldUrl = existing.rows[0].profile_picture;
      const parts = oldUrl.split("/");
      const folderAndFile = parts.slice(parts.indexOf("mars")).join("/");
      const publicId = folderAndFile.replace(/\.[^.]+$/, "");
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    await client.query(
      "UPDATE Users SET Profile_Picture = NULL WHERE User_ID = $1",
      [userId]
    );

    await client.query("COMMIT");
    res.json({ message: "Profile picture removed" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
