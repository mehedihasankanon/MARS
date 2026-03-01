const pool = require("../../../database/db.js");

exports.getMyAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Addresses WHERE User_ID = $1 ORDER BY Address_Type",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { house, streetRoad, city, zipCode, addressType } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      `INSERT INTO Addresses (User_ID, House, Street_Road, City, Zip_Code, Address_Type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, house, streetRoad, city, zipCode, addressType || "Shipping"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
