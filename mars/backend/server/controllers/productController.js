const pool = require("../../../database/db.js");

exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT p.*, c.Name as category_name, u.Username as seller_name 
            FROM products p
            JOIN Categories c ON p.Category_ID = c.Category_ID
            JOIN Sellers s ON p.Seller_ID = s.Seller_ID
            JOIN Users u ON s.seller_id = u.User_ID
            ORDER BY p.Adding_Date DESC
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT p.*, c.Name as category_name, u.Username as seller_name 
            FROM products p
            JOIN Categories c ON p.Category_ID = c.Category_ID
            JOIN Sellers s ON p.Seller_ID = s.Seller_ID
            JOIN Users u ON s.seller_id = u.User_ID
            WHERE p.Product_ID = $1
        `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      unitPrice,
      stockQuantity,
      conditionState,
      categoryId,
    } = req.body;
    const sellerId = req.user.userId;

    const result = await pool.query(
      `
            INSERT INTO Products (Seller_ID, Category_ID, Name, Description, Unit_Price, Stock_Quantity, Condition_State)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `,
      [
        sellerId,
        categoryId,
        name,
        description,
        unitPrice,
        stockQuantity,
        conditionState,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unitPrice, stockQuantity, conditionState, categoryId } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await pool.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (ownerCheck.rows[0].seller_id !== userId) {
        return res.status(403).json({ error: "You can only edit your own products" });
      }
    }

    const result = await pool.query(
      `UPDATE Products
       SET Name = COALESCE($1, Name),
           Description = COALESCE($2, Description),
           Unit_Price = COALESCE($3, Unit_Price),
           Stock_Quantity = COALESCE($4, Stock_Quantity),
           Condition_State = COALESCE($5, Condition_State),
           Category_ID = COALESCE($6, Category_ID)
       WHERE Product_ID = $7
       RETURNING *`,
      [name, description, unitPrice, stockQuantity, conditionState, categoryId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await pool.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (ownerCheck.rows[0].seller_id !== userId) {
        return res.status(403).json({ error: "You can only delete your own products" });
      }
    }

    const result = await pool.query(
      "DELETE FROM Products WHERE Product_ID = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
