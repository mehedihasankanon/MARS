const { Pool } = require("pg");

let connectionString = process.env.DATABASE_URL;
if (connectionString && !connectionString.includes('uselibpqcompat=true')) {
  connectionString += connectionString.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true';
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Wrap pool.connect so every client has search_path set BEFORE it is returned.
const originalConnect = pool.connect.bind(pool);
pool.connect = async function (...args) {
  // Callback style: pool.connect((err, client, done) => { ... })
  if (typeof args[0] === 'function') {
    const cb = args[0];
    try {
      const client = await originalConnect();
      await client.query('SET search_path TO mars');
      cb(null, client, client.release.bind(client));
    } catch (err) {
      cb(err);
    }
    return;
  }
  // Promise style: const client = await pool.connect()
  const client = await originalConnect();
  await client.query('SET search_path TO mars');
  return client;
};

// Wrap pool.query so one-off queries also get the correct search_path.
const originalQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  const client = await pool.connect();
  try {
    return await client.query(...args);
  } finally {
    client.release();
  }
};

module.exports = pool;
