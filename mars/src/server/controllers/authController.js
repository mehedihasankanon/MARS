const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../database/db.js");

const { JWT_SECRET } = require("../middleware/jwt.js");
const { Caveat } = require("next/font/google/index.js");

exports.registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, phone, role } =
    req.body;

  try {
    const ifExtsists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    if (ifExtsists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already in use" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userResultQuery = await pool.query(
      "INSERT INTO users (username, email, password, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [username, email, hashedPassword, firstName, lastName, phone],
    );

    const user = userResultQuery.rows[0];

    if (role === "customer") {
      await pool.query("INSERT INTO customers (user_id) VALUES ($1)", [
        user.user_id,
      ]);
    } else if (role === "seller") {
      await pool.query("INSERT INTO sellers (user_id) VALUES ($1)", [
        user.user_id,
      ]);
    }

    const token = jwt.sign(
      { userId: user.user_id, role: role || "customer" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResultQuery = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    if (userResultQuery.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = userResultQuery.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    let role = "customer";

    const adminCheck = await pool.query(
      "SELECT * FROM admins WHERE user_id = $1",
      [user.user_id],
    );
    if (adminCheck.rows.length > 0) {
      role = "admin";
    } else {
      const sellerCheck = await pool.query(
        "SELECT * FROM sellers WHERE user_id = $1",
        [user.user_id],
      );
      if (sellerCheck.rows.length > 0) {
        role = "seller";
      }
    }

    await pool.query("UPDATE Users SET Last_Login = NOW() WHERE User_ID = $1", [
      user.user_id,
    ]);

    const token = jwt.sign({ userId: user.user_id, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user,
      role,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
