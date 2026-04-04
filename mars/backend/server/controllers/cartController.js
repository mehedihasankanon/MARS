const pool = require("../../../database/db");

exports.getCartItems = async (req, res) => {
  const userId = req.user.userId;

  try {
    const cartQuery = await pool.query(
      `SELECT c.*, json_agg(json_build_object(
                'product_id', ci.Product_ID,
                'quantity', ci.Quantity,
                'net_price', ci.Net_Price
            )) FILTER (WHERE ci.Product_ID IS NOT NULL) AS items
             FROM carts c
             LEFT JOIN Cart_items ci ON c.Cart_ID = ci.Cart_ID
             WHERE c.Customer_ID = $1
             GROUP BY c.Cart_ID`,
      [userId],
    );

    res.json(cartQuery.rows[0] || { items: [] });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addItemToCart = async (req, res) => {
  try {
    const customer_id = req.user.userId;
    const { product_id, quantity } = req.body;

    await pool.query(
      "SELECT mars.add_to_cart($1, $2, $3)",
      [customer_id, product_id, quantity]
    );

    res.status(201).json({ message: "Item added to cart" });
  } catch (err) {
    console.error("Error adding item to cart:", err);
    // The DB function raises descriptive exceptions
    res.status(400).json({ message: err.message || "Internal server error" });
  }
};

exports.removeItemFromCart = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const customer_id = req.user.userId;
    const { itemId } = req.params;

    const deleteQuery = await client.query(
      `DELETE FROM Cart_Items
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $1)
       AND Product_ID = $2`,
      [customer_id, itemId],
    );

    if (deleteQuery.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await client.query("COMMIT");
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.updateCartItem = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const user_id = req.user.userId;
    const { product_id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const priceResult = await client.query(
      `SELECT p.Stock_Quantity,
              (p.Unit_Price * (1 - COALESCE((
                 SELECT MAX(po.Offer_Percent)
                 FROM Product_Offers po
                 WHERE po.Product_ID = p.Product_ID
                   AND NOW() >= po.Start_Date AND NOW() <= po.Expiry_Date
              ), 0) / 100.0)) AS effective_unit
       FROM Products p WHERE p.Product_ID = $1`,
      [product_id],
    );

    if (!priceResult.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    const effectiveUnit = parseFloat(priceResult.rows[0].effective_unit);
    const stockQuantity = priceResult.rows[0].stock_quantity;

    if (quantity > stockQuantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot set quantity to ${quantity}. Only ${stockQuantity} available in stock.`,
      });
    }

    const net_price = effectiveUnit * quantity;

    const updateQuery = await client.query(
      `UPDATE Cart_Items
       SET Quantity = $1, Net_Price = $2
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $3)
       AND Product_ID = $4`,
      [quantity, net_price, user_id, product_id],
    );

    if (updateQuery.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await client.query("COMMIT");
    res.json({ message: "Cart item updated" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
