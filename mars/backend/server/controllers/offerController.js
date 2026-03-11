const pool = require("../../../database/db.js");

// ─── GET /api/offers ────────────────────────────────────────────────
// Public. Returns all ACTIVE offers (where NOW is between start and
// expiry). Joins Products so the frontend can show offer badges on
// product cards without an extra API call.
exports.getActiveOffers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.Offer_ID   AS offer_id,
              o.Product_ID AS product_id,
              o.Offer_Percent AS offer_percent,
              o.Start_Date AS start_date,
              o.Expiry_Date AS expiry_date,
              p.Name       AS product_name,
              p.Unit_Price AS original_price,
              -- Pre-compute the sale price so the frontend doesn't need to.
              ROUND(p.Unit_Price * (1 - o.Offer_Percent / 100), 2) AS sale_price
       FROM Product_Offers o
       JOIN Products p ON o.Product_ID = p.Product_ID
       WHERE NOW() BETWEEN o.Start_Date AND o.Expiry_Date
       ORDER BY o.Expiry_Date ASC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching active offers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ─── GET /api/offers/product/:productId ─────────────────────────────
// Public. Returns all offers (active + expired) for a single product.
// Useful on the product detail page to show current deals and past
// promotions.
exports.getOffersByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT o.Offer_ID   AS offer_id,
              o.Offer_Percent AS offer_percent,
              o.Start_Date AS start_date,
              o.Expiry_Date AS expiry_date,
              u.Username   AS created_by,
              -- Let the frontend know if this offer is currently live.
              CASE
                WHEN NOW() BETWEEN o.Start_Date AND o.Expiry_Date THEN true
                ELSE false
              END AS is_active
       FROM Product_Offers o
       JOIN Users u ON o.Created_By_Seller_ID = u.User_ID
       WHERE o.Product_ID = $1
       ORDER BY o.Start_Date DESC`,
      [productId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching offers for product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ─── POST /api/offers ───────────────────────────────────────────────
// Seller or admin. Creates a time-limited discount on a product.
//
// Schema reminder:
//   Product_Offers(Offer_ID uuid PK, Product_ID FK→Products,
//     Created_By_Seller_ID FK→Sellers, Offer_Percent decimal(5,2),
//     Start_Date timestamp, Expiry_Date timestamp)
//
// The FK on Created_By_Seller_ID → Sellers means only users in the
// Sellers table can be stored here. We also verify ownership so
// seller A can't create offers on seller B's products.
exports.createOffer = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sellerId = req.user.userId;
    const role = req.user.role;
    const { productId, offerPercent, startDate, expiryDate } = req.body;

    // ── Validate inputs ────────────────────────────────────────────
    if (!productId || offerPercent == null || !startDate || !expiryDate) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error:
          "productId, offerPercent, startDate, and expiryDate are all required",
      });
    }

    if (offerPercent <= 0 || offerPercent > 100) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "offerPercent must be between 0.01 and 100" });
    }

    if (new Date(expiryDate) <= new Date(startDate)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "expiryDate must be after startDate" });
    }

    // ── Verify the product exists and the seller owns it ───────────
    // Admins can bypass the ownership check since they oversee
    // the entire marketplace.
    const productResult = await client.query(
      "SELECT Seller_ID FROM Products WHERE Product_ID = $1",
      [productId],
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    if (role !== "admin" && productResult.rows[0].seller_id !== sellerId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "You can only create offers on your own products" });
    }

    // ── Insert the offer ───────────────────────────────────────────
    const result = await client.query(
      `INSERT INTO Product_Offers
         (Product_ID, Created_By_Seller_ID, Offer_Percent, Start_Date, Expiry_Date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [productId, sellerId, offerPercent, startDate, expiryDate],
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// ─── PUT /api/offers/:id ────────────────────────────────────────────
// Seller or admin. Updates an existing offer's percent and/or dates.
// Only the seller who created the offer (or an admin) can change it.
exports.updateOffer = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;
    const { offerPercent, startDate, expiryDate } = req.body;

    // ── Verify the offer exists and the caller owns it ─────────────
    const offerResult = await client.query(
      "SELECT Created_By_Seller_ID FROM Product_Offers WHERE Offer_ID = $1",
      [id],
    );

    if (offerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Offer not found" });
    }

    if (
      role !== "admin" &&
      offerResult.rows[0].created_by_seller_id !== userId
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "You can only update your own offers" });
    }

    // ── Validate percent if provided ───────────────────────────────
    if (offerPercent != null && (offerPercent <= 0 || offerPercent > 100)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "offerPercent must be between 0.01 and 100" });
    }

    // ── COALESCE keeps unchanged fields at their current value ─────
    const result = await client.query(
      `UPDATE Product_Offers
       SET Offer_Percent = COALESCE($1, Offer_Percent),
           Start_Date    = COALESCE($2, Start_Date),
           Expiry_Date   = COALESCE($3, Expiry_Date)
       WHERE Offer_ID = $4
       RETURNING *`,
      [offerPercent || null, startDate || null, expiryDate || null, id],
    );

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// ─── DELETE /api/offers/:id ─────────────────────────────────────────
// Seller or admin. Removes an offer entirely. Because Product_Offers
// has ON DELETE CASCADE from the Product_ID FK, deleting the parent
// product would already clean these up. But sellers may also want to
// manually retract a promotion.
exports.deleteOffer = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    // ── Ownership check ────────────────────────────────────────────
    const offerResult = await client.query(
      "SELECT Created_By_Seller_ID FROM Product_Offers WHERE Offer_ID = $1",
      [id],
    );

    if (offerResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Offer not found" });
    }

    if (
      role !== "admin" &&
      offerResult.rows[0].created_by_seller_id !== userId
    ) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "You can only delete your own offers" });
    }

    await client.query("DELETE FROM Product_Offers WHERE Offer_ID = $1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting offer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
