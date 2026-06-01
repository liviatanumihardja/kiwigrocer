// seed.js
// Run this ONCE to populate your database with realistic dummy data.
// Command: node seed.js
//
// It will wipe any existing submissions and insert fresh ones,
// so you can re-run it any time you want to reset your data.

const db = require("./database");

// ── 1. LOCATIONS ─────────────────────────────────────────────────────────────
// Each location has a price "modifier" — a small multiplier that reflects
// regional cost-of-living differences across NZ.
// 1.00 = baseline, 1.05 = 5% more expensive than baseline, etc.

const LOCATIONS = [
  { name: "Auckland, Auckland",          modifier: 1.06 },
  { name: "Wellington, Wellington",       modifier: 1.04 },
  { name: "Christchurch, Canterbury",     modifier: 1.00 },
  { name: "Hamilton, Waikato",            modifier: 0.99 },
  { name: "Tauranga, Bay of Plenty",      modifier: 1.02 },
  { name: "Dunedin, Otago",              modifier: 0.98 },
  { name: "Palmerston North, Manawatū",   modifier: 0.97 },
  { name: "Napier, Hawke's Bay",          modifier: 1.01 },
  { name: "Nelson, Nelson",              modifier: 1.00 },
  { name: "Queenstown, Otago",           modifier: 1.08 },
  { name: "Rotorua, Bay of Plenty",       modifier: 0.99 },
  { name: "New Plymouth, Taranaki",       modifier: 1.00 },
  { name: "Invercargill, Southland",      modifier: 0.96 },
  { name: "Whangarei, Northland",         modifier: 1.01 },
  { name: "Gisborne, Gisborne",          modifier: 1.00 },
  { name: "Blenheim, Marlborough",        modifier: 0.99 },
  { name: "Hastings, Hawke's Bay",        modifier: 1.01 },
  { name: "Levin, Manawatū",             modifier: 0.97 },
  { name: "Masterton, Wairarapa",         modifier: 0.98 },
];

// ── 2. STORES ─────────────────────────────────────────────────────────────────
// Each store also has a pricing "personality":
//   baseMultiplier  — overall price level (Pak'nSave cheapest, NW most expensive)
//   variance        — how much prices deviate from the base (adds realism)

const STORES = [
  { id: "pak-n-save", name: "Pak'nSave",  baseMultiplier: 0.93, variance: 0.03 },
  { id: "woolworths", name: "Woolworths", baseMultiplier: 1.00, variance: 0.04 },
  { id: "new-world",  name: "New World",  baseMultiplier: 1.07, variance: 0.05 },
];

// ── 3. PRODUCTS ───────────────────────────────────────────────────────────────
// marketPrice is the NZ "true market average" for each item.
// Each store + location combo will vary from this using their multipliers.
//
// cheapestStore overrides which store wins for that product —
// this stops Pak'nSave winning every single item.
// Options: "pak-n-save" | "woolworths" | "new-world" | null (let math decide)

const PRODUCTS = [
  // Dairy & Eggs
  { id:1,  name:"Anchor Full Cream Milk",       category:"Dairy & Eggs",   unit:"2L",         emoji:"🥛", marketPrice: 3.69, cheapestStore: "pak-n-save" },
  { id:2,  name:"Anchor Trim Milk",             category:"Dairy & Eggs",   unit:"2L",         emoji:"🥛", marketPrice: 3.69, cheapestStore: "pak-n-save" },
  { id:3,  name:"Free Range Eggs",              category:"Dairy & Eggs",   unit:"12 pack",    emoji:"🥚", marketPrice: 9.00, cheapestStore: "woolworths" },
  { id:4,  name:"Mainland Butter",              category:"Dairy & Eggs",   unit:"500g",       emoji:"🧈", marketPrice: 6.50, cheapestStore: "pak-n-save" },
  { id:5,  name:"Tasty Cheddar Cheese",         category:"Dairy & Eggs",   unit:"500g",       emoji:"🧀", marketPrice: 7.50, cheapestStore: "woolworths" },
  { id:6,  name:"Meadow Fresh Natural Yoghurt", category:"Dairy & Eggs",   unit:"1kg",        emoji:"🫙", marketPrice: 5.50, cheapestStore: "new-world"  },
  // Bakery
  { id:7,  name:"Tip Top White Sandwich Bread", category:"Bakery",         unit:"700g",       emoji:"🍞", marketPrice: 3.50, cheapestStore: "pak-n-save" },
  { id:8,  name:"Vogel's Mixed Grain Bread",    category:"Bakery",         unit:"720g",       emoji:"🍞", marketPrice: 5.00, cheapestStore: "woolworths" },
  { id:9,  name:"Bazaar Wraps",                 category:"Bakery",         unit:"8 pack",     emoji:"🫓", marketPrice: 3.30, cheapestStore: "pak-n-save" },
  // Breakfast
  { id:10, name:"Weet-Bix Cereal",              category:"Breakfast",      unit:"750g",       emoji:"🥣", marketPrice: 5.00, cheapestStore: "pak-n-save" },
  { id:11, name:"Sanitarium Up&Go",             category:"Breakfast",      unit:"6 pack",     emoji:"🥤", marketPrice: 6.80, cheapestStore: "woolworths" },
  { id:12, name:"Rolled Oats",                  category:"Breakfast",      unit:"1kg",        emoji:"🌾", marketPrice: 2.90, cheapestStore: "pak-n-save" },
  // Fruit
  { id:13, name:"Royal Gala Apples",            category:"Fruit",          unit:"per kg",     emoji:"🍎", marketPrice: 3.50, cheapestStore: "pak-n-save" },
  { id:14, name:"Bananas",                      category:"Fruit",          unit:"per kg",     emoji:"🍌", marketPrice: 2.40, cheapestStore: "pak-n-save" },
  { id:15, name:"Strawberries",                 category:"Fruit",          unit:"250g punnet",emoji:"🍓", marketPrice: 4.50, cheapestStore: "woolworths" },
  { id:16, name:"Navel Oranges",                category:"Fruit",          unit:"per kg",     emoji:"🍊", marketPrice: 3.30, cheapestStore: "new-world"  },
  // Vegetables
  { id:17, name:"Carrots",                      category:"Vegetables",     unit:"1kg bag",    emoji:"🥕", marketPrice: 1.80, cheapestStore: "pak-n-save" },
  { id:18, name:"Baby Spinach",                 category:"Vegetables",     unit:"120g",       emoji:"🥬", marketPrice: 2.90, cheapestStore: "woolworths" },
  { id:19, name:"Broccoli",                     category:"Vegetables",     unit:"per head",   emoji:"🥦", marketPrice: 2.70, cheapestStore: "pak-n-save" },
  { id:20, name:"Agria Potatoes",               category:"Vegetables",     unit:"2kg bag",    emoji:"🥔", marketPrice: 3.90, cheapestStore: "pak-n-save" },
  { id:21, name:"Iceberg Lettuce",              category:"Vegetables",     unit:"per head",   emoji:"🥗", marketPrice: 2.40, cheapestStore: "woolworths" },
  { id:22, name:"Tomatoes",                     category:"Vegetables",     unit:"per kg",     emoji:"🍅", marketPrice: 4.50, cheapestStore: "new-world"  },
  { id:23, name:"Brown Onions",                 category:"Vegetables",     unit:"1kg bag",    emoji:"🧅", marketPrice: 2.20, cheapestStore: "pak-n-save" },
  { id:24, name:"Garlic",                       category:"Vegetables",     unit:"per bulb",   emoji:"🧄", marketPrice: 0.99, cheapestStore: "woolworths" },
  // Meat & Seafood
  { id:25, name:"Beef Mince",                   category:"Meat & Seafood", unit:"500g",       emoji:"🥩", marketPrice: 9.50, cheapestStore: "pak-n-save" },
  { id:26, name:"Chicken Breast",               category:"Meat & Seafood", unit:"per kg",     emoji:"🍗", marketPrice:11.50, cheapestStore: "pak-n-save" },
  { id:27, name:"Pork Sausages",                category:"Meat & Seafood", unit:"500g",       emoji:"🌭", marketPrice: 5.80, cheapestStore: "woolworths" },
  { id:28, name:"Hoki Fish Fillets",            category:"Meat & Seafood", unit:"400g",       emoji:"🐟", marketPrice: 7.50, cheapestStore: "new-world"  },
  // Pantry
  { id:29, name:"Pam's White Rice",             category:"Pantry",         unit:"2kg",        emoji:"🍚", marketPrice: 3.80, cheapestStore: "pak-n-save" },
  { id:30, name:"Barilla Spaghetti",            category:"Pantry",         unit:"500g",       emoji:"🍝", marketPrice: 2.90, cheapestStore: "woolworths" },
];

// ── 4. HELPERS ────────────────────────────────────────────────────────────────

// Round a price to a realistic supermarket price ending (.49, .79, .99, .09 etc.)
function realisticPrice(raw) {
  const endings = [0.49, 0.79, 0.99, 0.09, 0.19, 0.29, 0.39, 0.59, 0.69, 0.89];
  const base = Math.floor(raw);
  // Pick the ending closest to the raw decimal
  const decimal = raw - base;
  const closest = endings.reduce((a, b) =>
    Math.abs(b - decimal) < Math.abs(a - decimal) ? b : a
  );
  return parseFloat((base + closest).toFixed(2));
}

// Small random nudge within ±range
function jitter(range) {
  return (Math.random() * range * 2) - range;
}

// Fake a recent submission date within the last 14 days
function recentDate() {
  const daysAgo = Math.floor(Math.random() * 14);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

// ── 5. GENERATE & INSERT ──────────────────────────────────────────────────────

// Wipe existing seeded data (keeps any real user submissions if they have id > seeded range)
db.exec(`DELETE FROM submissions WHERE id <= 9999`);
console.log("🗑️  Cleared old seed data.\n");

const insert = db.prepare(`
  INSERT INTO submissions (id, product_id, product_name, store_id, store_name, price, location, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Use a transaction for speed — inserting hundreds of rows one-by-one is slow,
// wrapping them in a transaction makes it ~50x faster.
const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(...row);
});

let rows = [];
let seedId = 1; // We'll manually assign IDs 1–9999 for seed data

for (const location of LOCATIONS) {
  for (const product of PRODUCTS) {

    for (const store of STORES) {

      // Base price = market price × store multiplier × location modifier
      let basePrice = product.marketPrice * store.baseMultiplier * location.modifier;

      // Add a small random jitter so prices aren't perfectly proportional
      basePrice += jitter(store.variance * product.marketPrice);

      // If this store is designated cheapest for this product,
      // nudge its price down slightly to guarantee it wins
      if (product.cheapestStore === store.id) {
        basePrice *= 0.96; // 4% cheaper than its natural level
      }

      // Snap to a realistic price ending
      const finalPrice = realisticPrice(basePrice);

      // Add 2–4 submissions per store/product/location combo
      // so the "recent" feed looks active
      const submissionCount = 2 + Math.floor(Math.random() * 3);

      for (let i = 0; i < submissionCount; i++) {
        // Tiny micro-variance between individual submissions (±2 cents)
        const submittedPrice = realisticPrice(finalPrice + jitter(0.02));

        rows.push([
          seedId++,
          product.id,
          product.name,
          store.id,
          store.name,
          submittedPrice,
          location.name,
          recentDate()
        ]);
      }
    }
  }
}

insertMany(rows);

console.log(`✅ Seeded ${rows.length} submissions`);
console.log(`   ${LOCATIONS.length} locations × ${PRODUCTS.length} products × ${STORES.length} stores`);
console.log(`\nYou're good to go — run "node server.js" to start the app.\n`);
