const pool = require("../../../database/db.js");

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT r.Review_ID as review_id, r.Comment_Body as comment, r.Rating as rating,
              r.Review_Date as review_date, u.Username as username, u.Profile_Picture as profile_picture,
              EXISTS (
                  SELECT 1 FROM Order_Items oi
                  JOIN Orders o ON oi.Order_ID = o.Order_ID
                  WHERE o.Customer_ID = r.Customer_ID AND oi.Product_ID = r.Product_ID AND o.Order_Status = 'Delivered'
              ) as verified
       FROM Reviews r
       JOIN Users u ON r.Customer_ID = u.User_ID
       WHERE r.Product_ID = $1
       ORDER BY r.Review_Date DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createReview = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { productId } = req.params;
    const customerId = req.user.userId;
    const { comment, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const checkDuplicate = await client.query(
      "SELECT 1 FROM Reviews WHERE Customer_ID = $1 AND Product_ID = $2",
      [customerId, productId]
    );

    if (checkDuplicate.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "You have already reviewed this product" });
    }

    const result = await client.query(
      "INSERT INTO Reviews (Customer_ID, Product_ID, Comment_Body, Rating) VALUES ($1, $2, $3, $4) RETURNING Review_ID",
      [customerId, productId, comment || null, parseInt(rating)]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Review submitted",
      review_id: result.rows[0].review_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.deleteReview = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { productId, reviewId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    let query = "DELETE FROM Reviews WHERE Review_ID = $1 AND Product_ID = $2";
    const params = [reviewId, productId];

    if (role !== "admin") {
      query += " AND Customer_ID = $3";
      params.push(userId);
    }

    const result = await client.query(query + " RETURNING *", params);
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Review not found or not yours" });
    }

    await client.query("COMMIT");
    res.json({ message: "Review deleted" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
