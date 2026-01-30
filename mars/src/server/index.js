// server backend

const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../../.env.local" });

const pool = require("../database/db.js");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
