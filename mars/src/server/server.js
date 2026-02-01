require("dotenv").config({ path: "../../.env.local" });
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true },
});



// curl -X POST http://localhost:3001/users \
// -H "Content-Type: application/json" \
// -d '{"username": "jdoe_cool", "email": "john@example.com", "password": "secretpassword", "firstName": "John", "lastName": "Doe", "phone": "1234567890"}'


// --- INSERT DATA (POST) ---
app.post('/users', async (req, res) => {
  const { username, email, password, firstName, lastName, phone } = req.body;

  const insertQuery = `
    INSERT INTO Users (Username, Email, Password, First_Name, Last_Name, Phone_Number)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  try {
    const result = await pool.query(insertQuery, [
      username, 
      email, 
      password,
      firstName, 
      lastName, 
      phone
    ]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.detail || 'Failed to insert user' });
  }
});

// --- RETRIEVE DATA (GET) ---
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Users ORDER BY Created_at DESC');
    
    res.json({
      count: result.rowCount,
      users: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});