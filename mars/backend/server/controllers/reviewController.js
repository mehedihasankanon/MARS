const pool = require("../../../database/db.js");

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT r.Review_ID as review_id, r.Comment_Body as comment, r.Rating as rating,
              r.Review_Date as review_date, u.Username as username, u.Profile_Picture as profile_picture
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

    const result = await client.query(
      "CALL submit_review($1, $2, $3, $4, NULL)",
      [customerId, productId, comment || null, parseInt(rating)]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Review submitted",
      review_id: result.rows[0].p_review_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating review:", error);
    const msg = error.message || "";
    if (msg.includes("already reviewed")) {
      return res.status(409).json({ error: "You have already reviewed this product" });
    }
    if (msg.includes("purchased")) {
      return res.status(403).json({ error: "You can only review products you have purchased" });
    }
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
