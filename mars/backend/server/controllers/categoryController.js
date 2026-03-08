const pool = require("../../../database/db.js");

// api.get("/categories")
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.Name AS parent_name
       FROM Categories c
       LEFT JOIN Categories p ON c.Parent_Category_ID = p.Category_ID
       ORDER BY c.Name`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// api.post("/categories")
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
      [
        name.trim(),
        description || null,
        image || null,
        parentCategoryId || null,
        adminId,
      ],
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "A category with that name already exists" });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// api.put("/categories/:categoryname")
exports.updateCategory = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoryName = req.params.name;
    const { description, image, parentCategoryId } = req.body;
    const adminId = req.user.userId;

    if (!name || name.trim() === "") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Category name is cannot be empty" });
    }

    const update = await client.query(
      `
      UPDATE Categories
      SET Description = $1, Image = $2, Parent_Category_ID = $3, Updated_By_Admin_ID = $4
      WHERE Name = $5
      RETURNING *
      `,
      [
        description || "No Description",
        image || null,
        parentCategoryId || null,
        adminId,
        categoryName,
      ],
    );

    if (update.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }

    await client.query("COMMIT");
    res.json(update.rows[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// api.delete("/categories/:categoryname")
exports.deleteCategory = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoryName = req.params.name;

    const deleteQuery = await client.query(
      `
        DELETE 
        FROM Categories
        WHERE Name = $1
      `,
      [categoryName],
    );

    await client.query("COMMIT");

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
