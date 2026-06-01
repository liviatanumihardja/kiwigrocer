// database.js
// This file sets up our database and creates the table we need.
// Think of a table like a spreadsheet — rows are submissions, columns are the fields.

const Database = require("better-sqlite3");

// This creates a file called prices.db in your project folder.
// If it already exists, it just opens it.
const db = new Database("prices.db");

// Create the submissions table if it doesn't exist yet.
// Each submission stores: which product, which store, the price,
// which suburb, and when it was submitted.
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    store_id    TEXT NOT NULL,
    store_name  TEXT NOT NULL,
    price       REAL NOT NULL,
    location    TEXT NOT NULL,
    submitted_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

module.exports = db;
