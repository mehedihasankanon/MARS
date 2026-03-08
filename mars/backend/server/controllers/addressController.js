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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { house, streetRoad, city, zipCode, addressType } = req.body;
    const userId = req.user.userId;

    const result = await client.query(
      `INSERT INTO Addresses (User_ID, House, Street_Road, City, Zip_Code, Address_Type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, house, streetRoad, city, zipCode, addressType || "Shipping"]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.updateAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const { house, streetRoad, city, zipCode, addressType } = req.body;

    const result = await client.query(
      `UPDATE Addresses
       SET House = COALESCE($1, House),
           Street_Road = COALESCE($2, Street_Road),
           City = COALESCE($3, City),
           Zip_Code = COALESCE($4, Zip_Code),
           Address_Type = COALESCE($5, Address_Type)
       WHERE Address_ID = $6 AND User_ID = $7
       RETURNING *`,
      [house, streetRoad, city, zipCode, addressType, id, userId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Address not found" });
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.deleteAddress = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;

    const result = await client.query(
      "DELETE FROM Addresses WHERE Address_ID = $1 AND User_ID = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Address not found" });
    }

    await client.query("COMMIT");
    res.json({ message: "Address deleted" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
