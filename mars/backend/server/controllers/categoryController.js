const pool = require("../../../database/db.js");

/**
 * GET /api/categories
 * Returns all categories (public — no auth required).
 */
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

/**
 * POST /api/categories — Admin only
 * Creates a new category.
 * Body: { name, description, image, parentCategoryId }
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, parentCategoryId } = req.body;
    const adminId = req.user.userId;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Category name is required" });
    }

    const result = await pool.query(
      `INSERT INTO Categories (Name, Description, Image, Parent_Category_ID, Updated_By_Admin_ID)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description || null, image || null, parentCategoryId || null, adminId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // Unique constraint violation on Name
    if (error.code === "23505") {
      return res.status(409).json({ error: "A category with that name already exists" });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
