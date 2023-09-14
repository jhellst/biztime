/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"  // 1
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";

let db = new Client({
  connectionString: DB_URI
});

db.connect();                                   // 2

module.exports = db;                            // 3
