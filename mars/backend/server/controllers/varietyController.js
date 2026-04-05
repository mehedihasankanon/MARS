const pool = require("../../../database/db.js");

exports.getVarietiesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT Variety_ID AS variety_id,
              Product_ID AS product_id,
              Variety_Name AS variety_name
       FROM Product_Varieties
       WHERE Product_ID = $1
       ORDER BY Variety_Name`,
      [productId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching varieties:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createVariety = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { productId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    const { varietyName } = req.body;

    if (!varietyName || !varietyName.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "variety name is required" });
    }

    const productResult = await client.query(
      "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
      [productId],
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    if (role !== "admin" && productResult.rows[0].seller_id !== userId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "You can only add varieties to your own products" });
    }

    const dupCheck = await client.query(
      `SELECT 1 FROM Product_Varieties
       WHERE Product_ID = $1 AND LOWER(Variety_Name) = LOWER($2)`,
      [productId, varietyName.trim()],
    );

    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "This variety already exists on the product" });
    }

    const result = await client.query(
      `INSERT INTO Product_Varieties (Product_ID, Variety_Name)
       VALUES ($1, $2)
       RETURNING *`,
      [productId, varietyName.trim()],
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating variety:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.deleteVariety = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const varietyResult = await client.query(
      `SELECT v.Variety_ID, p.Seller_ID
       FROM Product_Varieties v
       JOIN Products p ON v.Product_ID = p.Product_ID
       WHERE v.Variety_ID = $1`,
      [id],
    );

    if (varietyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Variety not found" });
    }

    if (role !== "admin" && varietyResult.rows[0].seller_id !== userId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({
          error: "You can only delete varieties from your own products",
        });
    }

    await client.query("DELETE FROM Product_Varieties WHERE Variety_ID = $1", [
      id,
    ]);

    await client.query("COMMIT");
    res.json({ message: "Variety deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting variety:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
