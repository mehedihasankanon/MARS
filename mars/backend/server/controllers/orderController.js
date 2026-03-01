const pool = require("../../../database/db.js");

exports.getMyOrders = async (req, res) => {
  try {

    const result = await pool.query(
      `
            SELECT o.*, json_agg(json_build_object(
                'product_id', oi.Product_ID,
                'quantity', oi.quantity,
                'net_price', oi.Net_Price 
            )) as items 

            FROM Orders o
            JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
            WHERE o.Customer_ID = $1
            GROUP BY o.Order_ID
            ORDER BY o.Order_Date DESC
            `,
      [req.user.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.placeOrder = async (req, res) => {
  const customerId = req.user.userId;
  const { Items, addressId, couponId, deliveryFee } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = deliveryFee || 0.0;

    for (const item of Items) {
      const productResult = await client.query(
        "SELECT Unit_Price, Stock_Quantity FROM Products WHERE Product_ID = $1",
        [item.product_id],
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      if (productResult.rows[0].stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.product_id}`);
      }

      totalAmount += productResult.rows[0].unit_price * item.quantity;
    }

    const orderResult = await client.query(
      `
            INSERT INTO Orders (Customer_ID, Coupon_ID, Delivery_Fee, Total_Amount, Order_Status)
            VALUES ($1, $2, $3, $4, 'Pending')
            RETURNING *
            `,
      [customerId, couponId || null, deliveryFee || 0.0, totalAmount],
    );

    const order = orderResult.rows[0];

    for (const item of Items) {
      const productResult = await client.query(
        "SELECT Unit_Price FROM Products WHERE Product_ID = $1",
        [item.product_id],
      );
      const netPrice = productResult.rows[0].unit_price * item.quantity;

      await client.query(
        `
                INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Net_Price)
                VALUES ($1, $2, $3, $4)
            `,
        [order.order_id, item.product_id, item.quantity, netPrice],
      );

      await client.query(
        "UPDATE Products SET Stock_Quantity = Stock_Quantity - $1 WHERE Product_ID = $2",
        [item.quantity, item.product_id],
      );
    }

    await client.query(
      `
        INSERT INTO Shipments (Order_ID, Address_ID)
        VALUES ($1, $2)
        `,
      [order.order_id, addressId],
    );

    await client.query(
      `DELETE FROM Cart_Items
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $1)`,
      [customerId],
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Error placing order:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
