const pool = require("../../../database/db");

/**
 * Ensures a "seller" token is actually an approved seller in DB.
 * Admins bypass this check.
 */
exports.ensureApprovedSeller = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "seller") return next();
    if (req.user.role === "admin") return next();

    const sellerId = req.user.userId;
    const result = await pool.query(
      `SELECT Authorization_Date
       FROM Sellers
       WHERE Seller_ID = $1`,
      [sellerId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Seller account not found" });
    }

    if (!result.rows[0].authorization_date) {
      return res.status(403).json({ error: "Seller account is pending admin approval" });
    }

    next();
  } catch (err) {
    console.error("Error checking seller approval:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

