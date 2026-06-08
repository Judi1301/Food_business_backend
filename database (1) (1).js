const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "food_business.db");

let db;

function getDb() {
  if (!db) throw new Error("Database not initialised. Call initDb() first.");
  return db;
}

function initDb() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  createTables();
  seedData();
  console.log("Database ready at " + DB_PATH);
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      slug       TEXT    NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id  INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
      name         TEXT    NOT NULL,
      description  TEXT,
      price        REAL    NOT NULL CHECK(price >= 0),
      image_url    TEXT,
      badge        TEXT,
      tags         TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_featured  INTEGER NOT NULL DEFAULT 0,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name    TEXT    NOT NULL,
      phone        TEXT,
      email        TEXT,
      enquiry_type TEXT    NOT NULL DEFAULT 'General Enquiry',
      message      TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'new',
      admin_notes  TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_name TEXT    NOT NULL,
      location      TEXT,
      rating        INTEGER NOT NULL DEFAULT 5,
      body          TEXT    NOT NULL,
      is_approved   INTEGER NOT NULL DEFAULT 0,
      is_featured   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name  TEXT    NOT NULL,
      phone          TEXT    NOT NULL,
      email          TEXT,
      order_type     TEXT    NOT NULL DEFAULT 'Catering / Event Order',
      event_date     TEXT,
      guest_count    INTEGER,
      message        TEXT,
      status         TEXT    NOT NULL DEFAULT 'pending',
      total_amount   REAL,
      admin_notes    TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'staff',
      is_active     INTEGER NOT NULL DEFAULT 1,
      last_login    TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedData() {
  const alreadySeeded = db.prepare("SELECT COUNT(*) AS cnt FROM menu_categories").get().cnt > 0;
  if (alreadySeeded) return;

  console.log("Seeding initial data...");

  const insertCategory = db.prepare("INSERT INTO menu_categories (name, slug, sort_order) VALUES (?, ?, ?)");
  const catIds = {};
  for (const [name, slug, sort] of [
    ["Starters", "starters", 1],
    ["Signature Mains", "signature-mains", 2],
    ["Desserts", "desserts", 3],
    ["Beverages", "beverages", 4],
  ]) {
    catIds[slug] = insertCategory.run(name, slug, sort).lastInsertRowid;
  }

  const ins = db.prepare(`
    INSERT INTO menu_items (category_id,name,description,price,image_url,badge,tags,is_featured,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);

  ins.run(catIds["starters"], "Crispy Veg Pakoras", "Golden-fried mixed vegetable fritters with house-special green chutney and tamarind dip.", 140, "https://ikneadtoeat.com/wp-content/uploads/2021/10/pakora-recipe-new-7.jpg", "🌶 Spicy", "veg,spicy", 0, 1);
  ins.run(catIds["starters"], "Chicken 65", "Tender chicken marinated in fiery spices, deep-fried to perfection. A true South Indian classic.", 220, "https://t3.ftcdn.net/jpg/16/00/18/10/360_F_1600181037_6afxO52nIDCJeo1hxvpQ7Ozfn1g19Kaz.jpg", "🔥 Chef's Pick", "non-veg,spicy", 1, 2);
  ins.run(catIds["signature-mains"], "Signature Butter Chicken", "Rich, velvety tomato-cream gravy with tender chicken pieces. Served with buttery naan.", 320, "https://t3.ftcdn.net/jpg/06/01/41/68/360_F_601416862_AfYdeefqT1kGqWTx1DZCsJZVzYIDFzPR.jpg", "⭐ Best Seller", "non-veg,bestseller", 1, 1);
  ins.run(catIds["signature-mains"], "Dal Makhani", "Slow-cooked black lentils simmered overnight in cream and aromatic spices. Deeply comforting.", 240, "https://t3.ftcdn.net/jpg/08/49/52/72/360_F_849527258_uZ2uxCidsx9OMIPajT1U7SGmQd5aqwhq.jpg", "🌱 Veg", "veg", 0, 2);
  ins.run(catIds["signature-mains"], "Dum Biryani", "Fragrant long-grain basmati rice layered with spiced meat or vegetables, slow-cooked in a sealed handi.", 380, "https://t4.ftcdn.net/jpg/18/47/47/21/360_F_1847472123_ea7Lzzy7vaIvNjeXAlEQOOHKK4qZQSkV.jpg", "🥘 Specialty", "specialty", 1, 3);
  ins.run(catIds["desserts"], "Gulab Jamun", "Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm with vanilla ice cream.", 130, "https://someindiangirl.com/wp-content/uploads/2021/09/Gulab-Jamun-Ice-Cream-1-9-of-14-scaled.jpg", "🍮 Indulgent", "veg,sweet", 0, 1);
  ins.run(catIds["beverages"], "Fresh Lime Soda", "Chilled soda with hand-squeezed lime, a pinch of chaat masala.", 80, "https://images.pexels.com/photos/1187766/pexels-photo-1187766.jpeg", "🍋 Refreshing", "veg,cold", 0, 1);
  ins.run(catIds["beverages"], "Mango Lassi", "Thick, creamy yogurt blended with sweet Alphonso mango pulp.", 120, "https://img.magnific.com/free-photo/mango-juice-glass-dark-surface_1150-41957.jpg", "🥭 Seasonal", "veg,seasonal", 0, 2);

  const insertReview = db.prepare("INSERT INTO reviews (reviewer_name, location, rating, body, is_approved, is_featured) VALUES (?, ?, ?, ?, 1, 1)");
  insertReview.run("Radhika Sharma", "Yelahanka New Town, Bengaluru", 5, "Absolutely incredible food! The Butter Chicken here is the best I've had in Bengaluru. A true gem in Yelahanka!");
  insertReview.run("Arun Venkatesh", "Maruthi Nagar, Yelahanka", 5, "We ordered a catering package for our family function and they delivered beyond expectations. Highly recommended!");
  insertReview.run("Priya Nair", "Palanahalli, Bengaluru", 5, "The Dum Biryani is out of this world! A genuinely warm and welcoming place. My family's favourite!");
  insertReview.run("Karthik Mohan", "Yelahanka, Bengaluru", 5, "Been coming here almost every weekend! Chicken 65 and Mango Lassi are an unbeatable combo.");

  console.log("Seed data inserted.");
}

module.exports = { initDb, getDb };
