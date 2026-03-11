const pool = require("../../../database/db.js");

// router.post("/", authenticateToken, authorizeRoles("admin"), couponController.createCoupon);

exports.createCoupon = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminId = req.user.userId;
    {
      /* 
        REMINDER: send this from the frontend

        
        expiry_date: new Date("2025-12-31").toISOString() 


        */
    }
    const { discount_percent, expiry_date } = req.body;

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

    if (new Date(expiry_date) <= new Date()) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "expiry_date must be in the future" });
    }

    const result = await client.query(
      `INSERT INTO Coupons (Created_By_Admin_ID, Discount_Percent, Expiry_Date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [adminId, discount_percent, expiry_date],
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

// The Orders table has a FK to Coupons(Coupon_ID) WITHOUT
// ON DELETE CASCADE, which means Postgres will REJECT the delete if
// any order references this coupon. We don't
// want to lose the audit trail of which coupon was used on past orders.
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
    const { coupon_id } = req.body;

    if (!coupon_id) {
      return res.status(400).json({ error: "coupon_id is required" });
    }

    const result = await pool.query(
      "SELECT Coupon_ID, Discount_Percent, Expiry_Date FROM Coupons WHERE Coupon_ID = $1",
      [coupon_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const coupon = result.rows[0];

    if (new Date(coupon.expiry_date) < new Date()) {
      // 410 -> gone
      return res.status(410).json({ error: "This coupon has expired" });
    }

    res.json({
      valid: true,
      coupon_id: coupon.coupon_id,
      discount_percent: coupon.discount_percent,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// router.put("/disable/:id", authenticateToken, authorizeRoles("admin"), couponController.disableCoupon);

exports.disableCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      // set 1 day into the past
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
