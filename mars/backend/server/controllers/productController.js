const pool = require("../../../database/db.js");
const { cloudinary } = require("../config/cloudinary.js");

exports.getAllProducts = async (req, res) => {
  try {
    const { category, sort, search, seller } = req.query;
    const params = [];
    let paramIndex = 1;

    let whereClause = "";
    if (category) {
      whereClause = `WHERE c.Category_ID = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereClause += whereClause ? " AND " : "WHERE ";
      whereClause += `p.Name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (seller) {
      whereClause += whereClause ? " AND " : "WHERE ";
      whereClause += "p.Seller_ID = $" + paramIndex;
      params.push(seller);
      paramIndex++;
    }
    
    if (sort === "offers") {
      whereClause += whereClause ? " AND " : "WHERE ";
      whereClause += `EXISTS (
        SELECT 1
        FROM Product_Offers po
        WHERE po.Product_ID = p.Product_ID
          AND NOW() >= po.Start_Date
          AND NOW() <= po.Expiry_Date
      )`;
    }

    let orderClause = "ORDER BY p.Adding_Date DESC";
    if (sort === "price_asc") orderClause = "ORDER BY p.Unit_Price ASC";
    else if (sort === "price_desc") orderClause = "ORDER BY p.Unit_Price DESC";
    else if (sort === "popularity") orderClause = "ORDER BY order_count DESC, avg_rating DESC";
    else if (sort === "rating") orderClause = "ORDER BY avg_rating DESC, review_count DESC";
    else if (sort === "newest") orderClause = "ORDER BY p.Adding_Date DESC";
    else if (sort === "offers") orderClause = "ORDER BY discount_percent DESC, p.Adding_Date DESC";

    const result = await pool.query(
      `SELECT p.Product_ID, p.Seller_ID, p.Category_ID, p.Name, p.Description, p.Adding_Date, p.Stock_Quantity, p.Condition_State,
            p.Unit_Price as original_price,
            COALESCE(
              (SELECT po.Offer_Percent 
               FROM Product_Offers po 
               WHERE po.Product_ID = p.Product_ID AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date 
               ORDER BY po.Offer_Percent DESC LIMIT 1), 0
            ) as discount_percent,
            (p.Unit_Price * (1 - COALESCE(
              (SELECT po.Offer_Percent 
               FROM Product_Offers po 
               WHERE po.Product_ID = p.Product_ID AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date 
               ORDER BY po.Offer_Percent DESC LIMIT 1), 0
            ) / 100.0)) as unit_price,
            c.Name as category_name, u.Username as seller_name,
            s.Rating as seller_rating,
            COALESCE(
              (SELECT json_agg(json_build_object('image_id', pi.Image_ID, 'image_url', pi.Image_URL))
               FROM Product_Images pi WHERE pi.Product_ID = p.Product_ID), '[]'
            ) as images,
            get_product_avg_rating(p.Product_ID) as avg_rating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.Product_ID = p.Product_ID) as review_count,
            (SELECT COALESCE(SUM(oi.Quantity), 0) FROM Order_Items oi WHERE oi.Product_ID = p.Product_ID) as order_count
       FROM products p
       JOIN Categories c ON p.Category_ID = c.Category_ID
       JOIN Sellers s ON p.Seller_ID = s.Seller_ID
       JOIN Users u ON s.seller_id = u.User_ID
       ${whereClause}
       ${orderClause}`,
      params
    );
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
            SELECT p.Product_ID, p.Seller_ID, p.Category_ID, p.Name, p.Description, p.Adding_Date, p.Stock_Quantity, p.Condition_State,
            p.Unit_Price as original_price,
            COALESCE(
              (SELECT po.Offer_Percent 
               FROM Product_Offers po 
               WHERE po.Product_ID = p.Product_ID AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date 
               ORDER BY po.Offer_Percent DESC LIMIT 1), 0
            ) as discount_percent,
            (p.Unit_Price * (1 - COALESCE(
              (SELECT po.Offer_Percent 
               FROM Product_Offers po 
               WHERE po.Product_ID = p.Product_ID AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date 
               ORDER BY po.Offer_Percent DESC LIMIT 1), 0
            ) / 100.0)) as unit_price,
            c.Name as category_name, u.Username as seller_name,
            s.Rating as seller_rating,
            COALESCE(
              (SELECT json_agg(json_build_object('image_id', pi.Image_ID, 'image_url', pi.Image_URL))
               FROM Product_Images pi WHERE pi.Product_ID = p.Product_ID), '[]'
            ) as images,
            get_product_avg_rating(p.Product_ID) as avg_rating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.Product_ID = p.Product_ID) as review_count
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      name,
      description,
      unitPrice,
      stockQuantity,
      conditionState,
      categoryId,
    } = req.body;
    const sellerId = req.user.userId;

    const result = await client.query(
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

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.uploadProductImages = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await client.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }
      if (ownerCheck.rows[0].seller_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "You can only add images to your own products" });
      }
    }

    if (!req.files || req.files.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No image files provided" });
    }

    const insertedImages = [];
    for (const file of req.files) {
      const result = await client.query(
        "INSERT INTO Product_Images (Product_ID, Image_URL) VALUES ($1, $2) RETURNING *",
        [id, file.path]
      );
      insertedImages.push(result.rows[0]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Images uploaded", images: insertedImages });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error uploading product images:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.deleteProductImage = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id, imageId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await client.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }
      if (ownerCheck.rows[0].seller_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "You can only delete images from your own products" });
      }
    }

    const imageResult = await client.query(
      "SELECT Image_URL FROM Product_Images WHERE Image_ID = $1 AND Product_ID = $2",
      [imageId, id]
    );
    if (imageResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Image not found" });
    }

    const imageUrl = imageResult.rows[0].image_url;
    const parts = imageUrl.split("/");
    const folderAndFile = parts.slice(parts.indexOf("mars")).join("/");
    const publicId = folderAndFile.replace(/\.[^.]+$/, "");
    await cloudinary.uploader.destroy(publicId).catch(() => {});

    await client.query(
      "DELETE FROM Product_Images WHERE Image_ID = $1 AND Product_ID = $2",
      [imageId, id]
    );

    await client.query("COMMIT");
    res.json({ message: "Image deleted" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting product image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.updateProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { name, description, unitPrice, stockQuantity, conditionState, categoryId } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await client.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }
      if (ownerCheck.rows[0].seller_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "You can only edit your own products" });
      }
    }

    const result = await client.query(
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
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.deleteProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (role !== "admin") {
      const ownerCheck = await client.query(
        "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
        [id]
      );
      if (ownerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }
      if (String(ownerCheck.rows[0].seller_id) !== String(userId)) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "You can only delete your own products" });
      }
    }

    const result = await client.query(
      "DELETE FROM Products WHERE Product_ID = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    await client.query("COMMIT");
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
