const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat=true')) {
  connectionString += connectionString.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true';
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', client => {
  client.query('SET search_path TO mars');
});

module.exports = pool;
