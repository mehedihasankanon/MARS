const pool = require("../../../database/db");

exports.getWishlist = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;

    const result = await client.query(
      `SELECT p.Product_ID, p.Name, p.Description, p.Unit_Price, p.Stock_Quantity, p.Condition_State
       FROM Wishlists w
       JOIN Products p ON w.Product_ID = p.Product_ID
       WHERE w.Customer_ID = $1`,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.addItemToWishlist = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customer_id = req.user.userId;
    const itemId = req.params.itemid;

    // await client.query(
    //   `INSERT INTO Customers (Customer_ID) VALUES ($1) ON CONFLICT (Customer_ID) DO NOTHING`,
    //   [customer_id],
    // );

    const productResult = await client.query(
      `SELECT Product_ID, Seller_ID FROM Products WHERE Product_ID = $1`,
      [itemId],
    );

    if (!productResult.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    if (productResult.rows[0].seller_id === customer_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You cannot wishlist your own product" });
    }

    const insertResult = await client.query(
      `INSERT INTO Wishlists (Customer_ID, Product_ID)
       VALUES ($1, $2)
       ON CONFLICT (Customer_ID, Product_ID) DO NOTHING`,
      [customer_id, itemId],
    );

    await client.query("COMMIT");

    if (insertResult.rowCount === 0) {
      return res.status(409).json({ message: "Item already in wishlist" });
    }

    res.status(201).json({ message: "Item added to wishlist" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding item to wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.removeItemFromWishlist = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customer_id = req.user.userId;
    const itemId = req.params.itemid;

    const deleteQuery = await client.query(
      `DELETE FROM Wishlists WHERE Customer_ID = $1 AND Product_ID = $2`,
      [customer_id, itemId],
    );

    if (deleteQuery.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    await client.query("COMMIT");
    res.json({ message: "Item removed from wishlist" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error removing item from wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
