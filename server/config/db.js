const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/../.env" });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : null,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(() => console.log("MySQL connected successfully"))
  .catch(err => console.error("MySQL connection failed:", err.message));

module.exports = pool;