const mysql = require("mysql2");
require("dotenv").config();

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error connecting to the database:");
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused. Is MySQL running?");
    }
    console.error(err.message);
  } else {
    console.log("✅ Successfully connected to the Casertrace database.");
    connection.release();
  }
});

module.exports = db;
