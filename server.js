// server.js
// KiwiGrocer backend — Express + SQLite
// Run with: node server.js

const express = require("express");
const cors    = require("cors");
const db      = require("./database");

const app  = express();
const PORT = 3000;

// ── Middleware ──────────────────────────────────────────────────────────────

app.use(express.json());
app.use(cors());

// Serve index.html (and any other static files) from the project folder
app.use(express.static("."));


// ── Route 1: Submit a price ─────────────────────────────────────────────────
//
// POST /api/submit-price
// Body: { product_id, product_name, store_id, store_name, price, location }

app.post("/api/submit-price", (req, res) => {
  const { product_id, product_name, store_id, store_name, price, location } = req.body;

  if (!product_id || !store_id || !price || !location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (typeof price !== "number" || price <= 0 || price > 500) {
    return res.status(400).json({ error: "Price must be a positive number under $500." });
  }

  const result = db.prepare(`
    INSERT INTO submissions (product_id, product_name, store_id, store_name, price, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(product_id, product_name, store_id, store_name, price, location);

  console.log(`✅  ${product_name} | ${store_name} | $${price} | ${location}`);

  res.json({ success: true, id: result.lastInsertRowid });
});


// ── Route 2: Get prices for a product by location ───────────────────────────
//
// GET /api/prices/:product_id?location=Auckland, Auckland
//
// Returns one row per store — the average of the 5 most recent submissions
// for THAT store in THAT city. This is the query that was previously broken.
//
// THE BUG THAT WAS HERE:
//   The old query put LIMIT 5 on the whole subquery BEFORE grouping by store.
//   SQLite would grab the 5 globally newest rows (often all one store),
//   then group them — so other stores had zero rows and disappeared entirely.
//
// THE FIX:
//   Use a CTE (WITH clause) that adds a row_number per store using
//   ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY submitted_at DESC).
//   Then filter WHERE row_num <= 5 AFTER partitioning, so each store
//   independently contributes up to 5 recent rows before we average them.

app.get("/api/prices/:product_id", (req, res) => {
  const { product_id } = req.params;
  const { location }   = req.query;

  if (!location) {
    return res.status(400).json({ error: "Location query param is required." });
  }

  // Match on the city portion only ("Auckland" matches "Auckland, Auckland")
  const city = location.split(",")[0].trim();

  const rows = db.prepare(`
    WITH ranked AS (
      -- Step 1: pull all submissions for this product + city,
      -- and assign each row a rank WITHIN its store (newest = rank 1).
      SELECT
        store_id,
        store_name,
        price,
        submitted_at,
        ROW_NUMBER() OVER (
          PARTITION BY store_id          -- restart numbering for each store
          ORDER BY submitted_at DESC     -- newest submissions rank first
        ) AS row_num
      FROM submissions
      WHERE product_id = ?
        AND location LIKE ?
    )
    -- Step 2: keep only the top 5 rows per store, then average them.
    SELECT
      store_id,
      store_name,
      ROUND(AVG(price), 2) AS price,
      MAX(submitted_at)    AS submitted_at,
      COUNT(*)             AS submission_count
    FROM ranked
    WHERE row_num <= 5
    GROUP BY store_id
    ORDER BY price ASC
  `).all(product_id, `%${city}%`);

  res.json({ product_id, location, prices: rows });
});


// ── Route 3: Recent submissions feed ────────────────────────────────────────
//
// GET /api/recent
// Returns the 20 most recent submissions across all products and locations.
// Useful for a "recently updated" panel in the UI.

app.get("/api/recent", (req, res) => {
  const rows = db.prepare(`
    SELECT product_name, store_name, price, location, submitted_at
    FROM submissions
    ORDER BY submitted_at DESC
    LIMIT 20
  `).all();

  res.json({ submissions: rows });
});


// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🥝  KiwiGrocer running at http://localhost:${PORT}`);
  console.log(`    Serving index.html and API from the same server.\n`);
});
