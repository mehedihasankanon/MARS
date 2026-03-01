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
  const client = await pool.connect();
  try {
    const customer_id = req.user.userId;
    const { product_id, quantity } = req.body;

    await client.query(
      `INSERT INTO Carts (Customer_ID, Total_Amount)
       VALUES ($1, 0)
       ON CONFLICT (Customer_ID) DO NOTHING`,
      [customer_id],
    );

    const cartResult = await client.query(
      `SELECT Cart_ID FROM Carts WHERE Customer_ID = $1`,
      [customer_id],
    );

    const productResult = await client.query(
      `SELECT Unit_Price FROM Products WHERE Product_ID = $1`,
      [product_id],
    );

    if (!cartResult.rows[0] || !productResult.rows[0]) {
      return res.status(400).json({ message: "Cart or product not found" });
    }

    const cart_id = cartResult.rows[0].cart_id;
    const price = productResult.rows[0].unit_price;
    const net_price = price * quantity;

    await client.query(
      `INSERT INTO Cart_Items (Cart_ID, Product_ID, Quantity, Net_Price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (Cart_ID, Product_ID) 
       DO UPDATE SET Quantity = Cart_Items.Quantity + $3, Net_Price = Cart_Items.Net_Price + $4`,
      [cart_id, product_id, quantity, net_price],
    );

    res.status(201).json({ message: "Item added to cart" });
  } catch (err) {
    console.error("Error adding item to cart:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const customer_id = req.user.userId;
    const { itemId } = req.params;

    const deleteQuery = await pool.query(
      `DELETE FROM Cart_Items
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $1)
       AND Product_ID = $2`,
      [customer_id, itemId],
    );

    if (deleteQuery.rowCount === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { product_id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const priceResult = await pool.query(
      `SELECT Unit_Price FROM Products WHERE Product_ID = $1`,
      [product_id],
    );

    if (!priceResult.rows[0]) {
      return res.status(404).json({ message: "Product not found" });
    }

    const price = priceResult.rows[0].unit_price;
    const net_price = price * quantity;

    const updateQuery = await pool.query(
      `UPDATE Cart_Items
       SET Quantity = $1, Net_Price = $2
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $3)
       AND Product_ID = $4`,
      [quantity, net_price, user_id, product_id],
    );

    if (updateQuery.rowCount === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Cart item updated" });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
