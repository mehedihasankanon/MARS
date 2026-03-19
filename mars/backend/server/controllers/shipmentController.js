const pool = require("../../../database/db");

exports.getShipmentByOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const orderCheck = await client.query(
      `SELECT Customer_ID FROM Orders WHERE Order_ID = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isCustomer = orderCheck.rows[0].customer_id === userId;
    const isAdmin = req.user.role === 'admin';

    const sellerCheck = await client.query(
      `SELECT 1 FROM Order_Items oi
       JOIN Products p ON oi.Product_ID = p.Product_ID
       WHERE oi.Order_ID = $1 AND p.Seller_ID = $2`,
      [orderId, userId]
    );
    const isSeller = sellerCheck.rows.length > 0;

    if (!isCustomer && !isAdmin && !isSeller) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const shipmentResult = await client.query(
      `SELECT * FROM Shipments WHERE Order_ID = $1`,
      [orderId]
    );

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Shipment not found for this order" });
    }

    const shipment = shipmentResult.rows[0];

    const historyResult = await client.query(
      `SELECT * FROM Shipment_Status_History WHERE Shipment_ID = $1 ORDER BY Status_Date DESC`,
      [shipment.shipment_id]
    );
    shipment.history = historyResult.rows;

    res.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.updateShipment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { shipmentId } = req.params;
    const { trackingNumber, carrierName, shippedDate, actualDeliveryDate } = req.body;
    
    const shipmentCheck = await client.query(
      `SELECT Order_ID FROM Shipments WHERE Shipment_ID = $1`,
      [shipmentId]
    );

    if (shipmentCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Shipment not found" });
    }

    const orderId = shipmentCheck.rows[0].order_id;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      const sellerCheck = await client.query(
        `SELECT 1 FROM Order_Items oi
         JOIN Products p ON oi.Product_ID = p.Product_ID
         WHERE oi.Order_ID = $1 AND p.Seller_ID = $2`,
        [orderId, userId]
      );
      if (sellerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const updateQuery = `
      UPDATE Shipments 
      SET 
        Tracking_Number = COALESCE($1, Tracking_Number),
        Carrier_Name = COALESCE($2, Carrier_Name),
        Shipped_Date = COALESCE($3, Shipped_Date),
        Actual_Delivery_Date = COALESCE($4, Actual_Delivery_Date)
      WHERE Shipment_ID = $5
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      trackingNumber || null,
      carrierName || null,
      shippedDate || null,
      actualDeliveryDate || null,
      shipmentId
    ]);

    await client.query("COMMIT");
    res.json({ message: "Shipment updated successfully", shipment: updateResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating shipment:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
