const pool = require("../../../database/db.js");

exports.getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT q.Question_ID as question_id, q.Question_Text as question_text,
              q.Answer_Text as answer_text, q.Question_Date as question_date,
              q.Answer_Date as answer_date,
              cu.Username as customer_username,
              su.Username as seller_username
       FROM Questions q
       JOIN Users cu ON q.Customer_ID = cu.User_ID
       LEFT JOIN Users su ON q.Seller_ID = su.User_ID
       WHERE q.Product_ID = $1
       ORDER BY q.Question_Date DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createQuestion = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { productId } = req.params;
    const customerId = req.user.userId;
    const { questionText } = req.body;

    if (!questionText || !questionText.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Question text is required" });
    }

    const result = await client.query(
      `INSERT INTO Questions (Product_ID, Customer_ID, Question_Text)
       VALUES ($1, $2, $3) RETURNING *`,
      [productId, customerId, questionText.trim()]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.answerQuestion = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { productId, questionId } = req.params;
    const sellerId = req.user.userId;
    const { answerText } = req.body;

    if (!answerText || !answerText.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Answer text is required" });
    }

    const ownerCheck = await client.query(
      "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
      [productId]
    );
    if (ownerCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }
    if (ownerCheck.rows[0].seller_id !== sellerId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Only the product seller can answer questions" });
    }

    const result = await client.query(
      `UPDATE Questions
       SET Answer_Text = $1, Seller_ID = $2, Answer_Date = CURRENT_TIMESTAMP
       WHERE Question_ID = $3 AND Product_ID = $4
       RETURNING *`,
      [answerText.trim(), sellerId, questionId, productId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Question not found" });
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error answering question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
