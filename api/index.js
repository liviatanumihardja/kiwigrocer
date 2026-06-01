// api/index.js
const express = require("express");
const cors    = require("cors");
const { Pool } = require("pg"); // 👈 Changed from SQLite to Postgres

const app  = express();
app.use(express.json());
app.use(cors());
app.use(express.static("."));

// Connect to your Supabase via the Connection String we put in Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ── Route 1: Submit a price (Updated for Supabase) ───────────────────────────
app.post("/api/submit-price", async (req, res) => {
  const { product_id, product_name, store_id, store_name, price, location } = req.body;

  if (!product_id || !store_id || !price || !location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Standard Postgres query syntax using $1, $2 instead of ?
    const result = await pool.query(`
      INSERT INTO submissions (product_id, product_name, store_id, store_name, price, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [product_id, product_name, store_id, store_name, price, location]);

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error saving price." });
  }
});

// ── Route 2: Get prices (Updated for Supabase) ───────────────────────────
app.get("/api/prices/:product_id", async (req, res) => {
  const { product_id } = req.params;
  const { location }   = req.query;

  if (!location) {
    return res.status(400).json({ error: "Location query param is required." });
  }

  const city = location.split(",")[0].trim();

  try {
    const result = await pool.query(`
      WITH ranked AS (
        SELECT
          store_id,
          store_name,
          price,
          submitted_at,
          ROW_NUMBER() OVER (
            PARTITION BY store_id          
            ORDER BY submitted_at DESC     
          ) AS row_num
        FROM submissions
        WHERE product_id = $1
          AND location ILIKE $2
      )
      SELECT
        store_id,
        store_name,
        ROUND(AVG(price)::numeric, 2) AS price,
        MAX(submitted_at)    AS submitted_at,
        COUNT(*)             AS submission_count
      FROM ranked
      WHERE row_num <= 5
      GROUP BY store_id
      ORDER BY price ASC
    `, [product_id, `%${city}%`]);

    res.json({ product_id, location, prices: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error fetching prices." });
  }
});

// ── Route 3: Recent submissions feed (Updated for Supabase) ──────────────────
app.get("/api/recent", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT product_name, store_name, price, location, submitted_at
      FROM submissions
      ORDER BY submitted_at DESC
      LIMIT 20
    `);
    res.json({ submissions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error fetching recent items." });
  }
});

module.exports = app;