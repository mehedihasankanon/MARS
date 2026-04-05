const pool = require("../../../database/db.js");

exports.createCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminId = req.user.userId;
    const { discount_percent, expiry_date, coupon_code } = req.body;

    if (
      discount_percent == null ||
      discount_percent <= 0 ||
      discount_percent > 100
    ) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "discount percentage must be between 1 and 100" });
    }

    if (!expiry_date) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "expiry_date is required" });
    }

    const codeRaw = (coupon_code || "").trim();
    if (!codeRaw || codeRaw.length < 3 || codeRaw.length > 64) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "coupon_code is required (3–64 characters) so customers can remember it",
      });
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(codeRaw)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "coupon_code may only contain letters, numbers, underscores, and hyphens",
      });
    }

    if (new Date(expiry_date) <= new Date()) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "expiry_date must be in the future" });
    }

    const dup = await client.query(
      "SELECT 1 FROM Coupons WHERE LOWER(TRIM(coupon_code)) = LOWER(TRIM($1)) LIMIT 1",
      [codeRaw],
    );
    if (dup.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That coupon code is already in use" });
    }

    const result = await client.query(
      `INSERT INTO Coupons (Created_By_Admin_ID, Discount_Percent, Expiry_Date, coupon_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [adminId, discount_percent, expiry_date, codeRaw],
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.Coupon_ID   AS coupon_id,
              c.coupon_code AS coupon_code,
              c.Discount_Percent AS discount_percent,
              c.Expiry_Date AS expiry_date,
              u.Username    AS created_by,
              CASE 
                WHEN 
                  c.Expiry_Date < NOW() 
                THEN true 
                ELSE false 
              END AS is_expired
       FROM Coupons c
       LEFT JOIN Users u ON c.Created_By_Admin_ID = u.User_ID
       ORDER BY c.Expiry_Date DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const result = await client.query(
      "DELETE FROM Coupons WHERE Coupon_ID = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Coupon not found" });
    }

    await client.query("COMMIT");
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "Cannot delete this coupon because it has already been used in one or more orders",
      });
    }

    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const raw = (req.body.coupon_code || req.body.code || req.body.coupon_id || "").trim();

    if (!raw) {
      return res.status(400).json({ error: "Enter a coupon code" });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let result;
    if (uuidRegex.test(raw)) {
      result = await pool.query(
        "SELECT coupon_id, coupon_code, discount_percent, expiry_date FROM Coupons WHERE coupon_id = $1",
        [raw],
      );
    } else {
      result = await pool.query(
        "SELECT coupon_id, coupon_code, discount_percent, expiry_date FROM Coupons WHERE LOWER(TRIM(coupon_code)) = LOWER(TRIM($1))",
        [raw],
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or unknown coupon code" });
    }

    const coupon = result.rows[0];

    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(410).json({ error: "This coupon has expired" });
    }

    res.json({
      valid: true,
      coupon_id: coupon.coupon_id,
      coupon_code: coupon.coupon_code,
      discount_percent: coupon.discount_percent,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.disableCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE Coupons SET Expiry_Date = NOW() - INTERVAL '1 day' WHERE Coupon_ID = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.json({
      message: "Coupon disabled successfully",
      coupon: result.rows[0],
    });
  } catch (error) {
    console.error("Error disabling coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
