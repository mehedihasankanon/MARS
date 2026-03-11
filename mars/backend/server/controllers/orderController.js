const pool = require("../../../database/db.js");

exports.getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
            SELECT o.*,
            json_agg(json_build_object(
                'product_id', oi.Product_ID,
                'quantity', oi.quantity,
                'net_price', oi.Net_Price 
            )) as items,
            p.Payment_Method as payment_method,
            p.Payment_Status as payment_status,
            p.Payment_Date as payment_date

            FROM Orders o
            JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
            LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
            WHERE o.Customer_ID = $1
            GROUP BY o.Order_ID, p.Payment_Method, p.Payment_Status, p.Payment_Date
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

exports.getSellerOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.Order_ID,
        o.Order_Date,
        o.Order_Status,
        o.Total_Amount,
        u.Username as customer_name,
        json_agg(json_build_object(
          'product_id', oi.Product_ID,
          'product_name', pr.Name,
          'quantity', oi.Quantity,
          'net_price', oi.Net_Price,
          'unit_price', pr.Unit_Price
        )) as items,
        p.Payment_Method as payment_method,
        p.Payment_Status as payment_status
      FROM Orders o
      JOIN Order_Items oi ON oi.Order_ID = o.Order_ID
      JOIN Products pr ON pr.Product_ID = oi.Product_ID
      JOIN Sellers s ON s.Seller_ID = pr.Seller_ID
      JOIN Users u ON u.User_ID = o.Customer_ID
      LEFT JOIN Payments p ON p.Order_ID = o.Order_ID
      WHERE s.Seller_ID = $1
      GROUP BY o.Order_ID, o.Order_Date, o.Order_Status, o.Total_Amount,
               u.Username, p.Payment_Method, p.Payment_Status
      ORDER BY o.Order_Date DESC
      `,
      [req.user.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT 1 FROM Order_Items oi
       JOIN Products pr ON pr.Product_ID = oi.Product_ID
       WHERE oi.Order_ID = $1 AND pr.Seller_ID = $2
       LIMIT 1`,
      [orderId, req.user.userId],
    );

    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Not authorized to update this order" });
    }

    const result = await client.query(
      `UPDATE Orders SET Order_Status = $1 WHERE Order_ID = $2 RETURNING *`,
      [status, orderId],
    );

    await client.query("COMMIT");
    res.json({ message: "Order status updated", order: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.placeOrder = async (req, res) => {
  const customerId = req.user.userId;
  const { Items, addressId, couponId, deliveryFee } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let discountPercent = 0;

    if (couponId) {
      const couponResult = await client.query(
        "SELECT Discount_Percent, Expiry_Date FROM Coupons WHERE Coupon_ID = $1",
        [couponId],
      );

      if (couponResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Coupon not found" });
      }

      if (new Date(couponResult.rows[0].expiry_date) < new Date()) {
        await client.query("ROLLBACK");
        return res.status(410).json({ error: "This coupon has expired" });
      }

      discountPercent = parseFloat(couponResult.rows[0].discount_percent);
    }

    // ── 2. Validate every item and calculate the raw total ─────────
    // Total_Amount = sum of (unit_price × quantity) + delivery fee.
    // This is the BEFORE-discount total stored on the Orders row.
    let itemsTotal = 0;

    for (const item of Items) {
      const productResult = await client.query(
        "SELECT Unit_Price, Stock_Quantity FROM Products WHERE Product_ID = $1",
        [item.product_id],
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: `Product with ID ${item.product_id} not found` });
      }

      if (productResult.rows[0].stock_quantity < item.quantity) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({
            error: `Insufficient stock for product ID ${item.product_id}`,
          });
      }

      itemsTotal += productResult.rows[0].unit_price * item.quantity;
    }

    const totalAmount = itemsTotal + (deliveryFee || 0);

    const discountedNetPrice =
      discountPercent > 0
        ? itemsTotal * (1 - discountPercent / 100) + (deliveryFee || 0)
        : totalAmount;

    const orderResult = await client.query(
      `INSERT INTO Orders (Customer_ID, Coupon_ID, Delivery_Fee, Total_Amount, Discounted_Net_Price, Order_Status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING *`,
      [
        customerId,
        couponId || null,
        deliveryFee || 0,
        totalAmount,
        discountedNetPrice,
      ],
    );

    const order = orderResult.rows[0];

    // sellers see the true value of each item they sold.
    // discounted price is in the Orders table only
    for (const item of Items) {
      const productResult = await client.query(
        "SELECT Unit_Price FROM Products WHERE Product_ID = $1",
        [item.product_id],
      );
      const netPrice = productResult.rows[0].unit_price * item.quantity;

      await client.query(
        `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Net_Price)
         VALUES ($1, $2, $3, $4)`,
        [order.order_id, item.product_id, item.quantity, netPrice],
      );

      await client.query(
        "UPDATE Products SET Stock_Quantity = Stock_Quantity - $1 WHERE Product_ID = $2",
        [item.quantity, item.product_id],
      );
    }

    // ── 6. Create shipment placeholder ─────────────────────────────
    await client.query(
      `INSERT INTO Shipments (Order_ID, Address_ID)
       VALUES ($1, $2)`,
      [order.order_id, addressId],
    );

    // ── 7. Clear the customer's cart ───────────────────────────────
    await client.query(
      `DELETE FROM Cart_Items
       WHERE Cart_ID = (SELECT Cart_ID FROM Carts WHERE Customer_ID = $1)`,
      [customerId],
    );

    // ── 8. Create payment record ───────────────────────────────────
    const paymentMethod = req.body.paymentMethod || "Cash on Delivery";
    await client.query(
      `INSERT INTO Payments (Order_ID, Payment_Method, Payment_Status)
       VALUES ($1, $2, $3)`,
      [
        order.order_id,
        paymentMethod,
        paymentMethod === "Cash on Delivery" ? "Pending" : "Completed",
      ],
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
