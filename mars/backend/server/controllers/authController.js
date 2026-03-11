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
      await client.query("INSERT INTO sellers (seller_id) VALUES ($1)", [
        user.user_id,
      ]);
    }

    await client.query("COMMIT");

    const token = jwt.sign(
      { userId: user.user_id, role: role || "customer" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // extract the password, set it into a dummy value,
    // and set the remaining into the safeUser object to be sent in the response
    // we could alternately write `password: ignored` and be done with it 
    const { password: _, ...safeUser } = user;
    res.status(201).json({ message: "Login successful", token, user: safeUser, role });

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

    const adminCheck = await client.query(
      "SELECT * FROM admins WHERE admin_id = $1",
      [user.user_id],
    );
    if (adminCheck.rows.length > 0) {
      role = "admin";
    } else {
      const sellerCheck = await client.query(
        "SELECT * FROM sellers WHERE seller_id = $1",
        [user.user_id],
      );
      if (sellerCheck.rows.length > 0) {
        role = "seller";
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
    res.status(201).json({ message: "Login successful", token, user: safeUser, role });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
