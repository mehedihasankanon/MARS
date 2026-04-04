const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../../database/db.js");

const { JWT_SECRET } = require("../middleware/jwt.js");

exports.registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, phone, role } =
    req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ifExtsists = await client.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    if (ifExtsists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Email or username already in use" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userResultQuery = await client.query(
      "INSERT INTO users (username, email, password, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [username, email, hashedPassword, firstName, lastName, phone],
    );

    const user = userResultQuery.rows[0];

    await client.query("INSERT INTO customers (customer_id) VALUES ($1)", [
      user.user_id,
    ]);

    if (role === "seller") {
      // Create a seller row, but keep it pending admin approval until Authorization_Date is set.
      await client.query(
        "INSERT INTO sellers (seller_id) VALUES ($1) ON CONFLICT (seller_id) DO NOTHING",
        [user.user_id],
      );
    }

    await client.query("COMMIT");

    // Never issue a seller token at registration time; seller operation requires admin approval.
    const effectiveRole = role === "seller" ? "customer" : (role || "customer");
    const token = jwt.sign({ userId: user.user_id, role: effectiveRole }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // extract the password, set it into a dummy value,
    // and set the remaining into the safeUser object to be sent in the response
    // we could alternately write `password: ignored` and be done with it
    const { password: _, ...safeUser } = user;
    res.status(201).json({
      message: "Login successful",
      token,
      user: safeUser,
      role: effectiveRole,
      seller_pending_approval: role === "seller" ? true : undefined,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResultQuery = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (userResultQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = userResultQuery.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid password" });
    }

    let role = "customer";
    let seller_pending_approval = false;

    const adminCheck = await client.query(
      "SELECT * FROM admins WHERE admin_id = $1",
      [user.user_id],
    );
    if (adminCheck.rows.length > 0) {
      role = "admin";
    } else {
      const sellerCheck = await client.query(
        "SELECT Authorization_Date FROM sellers WHERE seller_id = $1",
        [user.user_id],
      );
      if (sellerCheck.rows.length > 0) {
        if (sellerCheck.rows[0].authorization_date) {
          role = "seller";
        } else {
          role = "customer";
          seller_pending_approval = true;
        }
      }
    }

    await client.query(
      "UPDATE Users SET Last_Login = NOW() WHERE User_ID = $1",
      [user.user_id],
    );

    await client.query("COMMIT");

    const token = jwt.sign({ userId: user.user_id, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password: _, ...safeUser } = user;
    res
      .status(201)
      .json({ message: "Login successful", token, user: safeUser, role, seller_pending_approval });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.forgotPassword = async (req, res) => {
  const email = (req.body.email || "").trim();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const client = await pool.connect();
  try {
    const found = await client.query(
      "SELECT user_id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [email],
    );

    const baseMessage = {
      message:
        "If an account exists for that email, use the reset link below to choose a new password.",
    };

    if (found.rows.length === 0) {
      return res.json(baseMessage);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await client.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE user_id = $3",
      [token, expires, found.rows[0].user_id],
    );

    const baseUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetLink = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    return res.json({ ...baseMessage, resetLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Reset token is required" });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      "SELECT user_id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()",
      [token.trim()],
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired reset link. Request a new one." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await client.query(
      "UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = $2",
      [hashedPassword, userRes.rows[0].user_id],
    );

    await client.query("COMMIT");
    return res.json({ message: "Password reset successfully. You can sign in now." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT password FROM Users WHERE User_ID = $1",
      [userId],
    );
    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password,
    );
    if (!passwordMatch) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await client.query("UPDATE Users SET password = $1 WHERE User_ID = $2", [
      hashedPassword,
      userId,
    ]);

    await client.query("COMMIT");
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// router.put("/add-admin", authenticateToken, authorizeRoles("admin"), authController.addAdmin);

// CREATE TABLE Users (
//     User_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     Username VARCHAR(100) UNIQUE NOT NULL,
//     Email VARCHAR(100) UNIQUE NOT NULL,
//     Password VARCHAR(255) NOT NULL,
//     First_Name VARCHAR(50) NOT NULL,
//     Last_Name VARCHAR(50),
//     Profile_Picture VARCHAR(255),
//     Phone_Number VARCHAR(20) NOT NULL,
//     Is_Active BOOLEAN DEFAULT TRUE,
//     Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     Last_Login TIMESTAMP
// );

exports.addAdmin = async (req, res) => {
  const { username, email, password, firstName, lastName, phone } = req.body;

  const client = await pool.connect();
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userResultQuery = await client.query(
    "INSERT INTO users (username, email, password, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [username, email, hashedPassword, firstName, lastName, phone],
  );

  const user = userResultQuery.rows[0];

  await client.query("INSERT INTO admins (admin_id) VALUES ($1)", [
    user.user_id,
  ]);

  res.status(201).json({ message: "Admin added successfully", user });
  try {
  } catch (err) {
  } finally {
    client.release();
  }
};
