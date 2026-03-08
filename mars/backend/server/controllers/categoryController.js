const pool = require("../../../database/db.js");

exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.Name AS parent_name
       FROM Categories c
       LEFT JOIN Categories p ON c.Parent_Category_ID = p.Category_ID
       ORDER BY c.Name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createCategory = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { name, description, image, parentCategoryId } = req.body;
    const adminId = req.user.userId;

    if (!name || name.trim() === "") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Category name is required" });
    }

    const result = await client.query(
      `INSERT INTO Categories (Name, Description, Image, Parent_Category_ID, Updated_By_Admin_ID)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description || null, image || null, parentCategoryId || null, adminId]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({ error: "A category with that name already exists" });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
