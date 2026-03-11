const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
const bcrypt = require("bcryptjs");
const pool = require("./db.js");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const categoryNames = [
      { name: "Clothing", desc: "Apparel, shoes, and accessories" },
      { name: "Home & Garden", desc: "Furniture, decor, and garden supplies" },
      { name: "Books", desc: "Fiction, non-fiction, and textbooks" },
      { name: "Sports & Outdoors", desc: "Sports equipment and outdoor gear" },
      { name: "Toys & Games", desc: "Toys, board games, and puzzles" },
    ];

    const categoryIds = {};
    for (const cat of categoryNames) {
      const res = await client.query(
        `INSERT INTO Categories (Name, Description)
         VALUES ($1, $2)
         ON CONFLICT (Name) DO UPDATE SET Description = EXCLUDED.Description
         RETURNING Category_ID, Name`,
        [cat.name, cat.desc]
      );
      categoryIds[res.rows[0].name] = res.rows[0].category_id;
    }

    const elecRes = await client.query(
      "SELECT Category_ID FROM Categories WHERE Name = 'Electronics'"
    );
    categoryIds["Electronics"] = elecRes.rows[0].category_id;

    console.log("Categories ready:", Object.keys(categoryIds).join(", "));

    const hashedPassword = await bcrypt.hash("Seller@123", 10);

    const sellers = [
      { username: "techworld", email: "techworld@mars.com", first: "Alex", last: "Chen", phone: "555-0101", shop: "TechWorld Store" },
      { username: "urbanstyle", email: "urbanstyle@mars.com", first: "Maya", last: "Johnson", phone: "555-0202", shop: "Urban Style Co." },
      { username: "bookworm", email: "bookworm@mars.com", first: "Liam", last: "Patel", phone: "555-0303", shop: "The Bookworm" },
    ];

    const sellerIds = [];

    for (const s of sellers) {
      const exists = await client.query(
        "SELECT User_ID FROM Users WHERE username = $1 OR email = $2",
        [s.username, s.email]
      );
      if (exists.rows.length > 0) {
        console.log(`  Seller "${s.username}" already exists, skipping...`);
        sellerIds.push(exists.rows[0].user_id);
        continue;
      }

      const userRes = await client.query(
        `INSERT INTO Users (Username, Email, Password, First_Name, Last_Name, Phone_Number)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING User_ID`,
        [s.username, s.email, hashedPassword, s.first, s.last, s.phone]
      );
      const uid = userRes.rows[0].user_id;

      await client.query("INSERT INTO Customers (Customer_ID) VALUES ($1)", [uid]);
      await client.query(
        "INSERT INTO Sellers (Seller_ID, Shop_Name) VALUES ($1, $2)",
        [uid, s.shop]
      );

      sellerIds.push(uid);
      console.log(`  Created seller "${s.username}" (${uid})`);
    }

    const techProducts = [
      { name: "Wireless Bluetooth Earbuds", desc: "Premium noise-cancelling earbuds with 30-hour battery life and IPX5 water resistance.", price: 49.99, stock: 150, condition: "New", cat: "Electronics" },
      { name: "Mechanical Gaming Keyboard", desc: "RGB backlit mechanical keyboard with Cherry MX Blue switches and full N-key rollover.", price: 89.99, stock: 75, condition: "New", cat: "Electronics" },
      { name: "Portable Power Bank 20000mAh", desc: "Fast-charging portable charger with USB-C PD and dual USB-A ports.", price: 34.99, stock: 200, condition: "New", cat: "Electronics" },
      { name: "Smart Fitness Watch", desc: "Waterproof fitness tracker with heart rate monitor, GPS, and 7-day battery life.", price: 129.99, stock: 60, condition: "New", cat: "Electronics" },
      { name: "USB-C Hub 7-in-1", desc: "Multi-port adapter with HDMI 4K, SD card reader, USB 3.0, and 100W PD pass-through.", price: 39.99, stock: 120, condition: "New", cat: "Electronics" },
      { name: "Adjustable Dumbbell Set", desc: "5-52.5 lb adjustable dumbbells with quick-change weight system. Space-saving design.", price: 299.99, stock: 25, condition: "New", cat: "Sports & Outdoors" },
    ];

    const urbanProducts = [
      { name: "Classic Denim Jacket", desc: "Vintage wash denim jacket with button closure. Unisex fit, available in sizes S-XXL.", price: 64.99, stock: 80, condition: "New", cat: "Clothing" },
      { name: "Canvas Sneakers", desc: "Lightweight canvas low-top sneakers with cushioned insole. Perfect for everyday wear.", price: 42.99, stock: 100, condition: "New", cat: "Clothing" },
      { name: "Oversized Hoodie", desc: "Ultra-soft fleece-lined hoodie with kangaroo pocket. Relaxed streetwear fit.", price: 54.99, stock: 90, condition: "New", cat: "Clothing" },
      { name: "Minimalist Desk Lamp", desc: "LED desk lamp with adjustable arm and 3 brightness levels. Modern matte black finish.", price: 29.99, stock: 110, condition: "New", cat: "Home & Garden" },
      { name: "Indoor Plant Pot Set", desc: "Set of 3 ceramic plant pots with drainage holes and bamboo saucers. White glaze finish.", price: 24.99, stock: 65, condition: "New", cat: "Home & Garden" },
      { name: "Woven Throw Blanket", desc: "Handwoven cotton throw blanket with fringe detail. 50x60 inches, machine washable.", price: 38.99, stock: 55, condition: "New", cat: "Home & Garden" },
    ];

    const bookProducts = [
      { name: "The Art of Problem Solving", desc: "Comprehensive guide to mathematical problem solving for students and enthusiasts. 480 pages.", price: 19.99, stock: 200, condition: "New", cat: "Books" },
      { name: "JavaScript: The Good Parts", desc: "Classic programming reference by Douglas Crockford. Essential reading for web developers.", price: 24.99, stock: 150, condition: "New", cat: "Books" },
      { name: "Sci-Fi Collection Box Set", desc: "5-book boxed set featuring award-winning science fiction novels. Paperback edition.", price: 44.99, stock: 40, condition: "New", cat: "Books" },
      { name: "World Atlas Illustrated Edition", desc: "Full-color illustrated world atlas with updated maps, statistics, and country profiles.", price: 32.99, stock: 70, condition: "New", cat: "Books" },
      { name: "Strategy Board Game: Conquest", desc: "Epic strategy board game for 2-6 players. Average playtime 90 minutes. Ages 12+.", price: 39.99, stock: 45, condition: "New", cat: "Toys & Games" },
      { name: "1000-Piece Jigsaw Puzzle", desc: "Premium quality 1000-piece jigsaw puzzle featuring a sunset cityscape. Finished size 27x20 inches.", price: 16.99, stock: 80, condition: "New", cat: "Toys & Games" },
    ];

    const allProducts = [
      { sellerId: sellerIds[0], products: techProducts },
      { sellerId: sellerIds[1], products: urbanProducts },
      { sellerId: sellerIds[2], products: bookProducts },
    ];

    let totalInserted = 0;
    for (const { sellerId, products } of allProducts) {
      for (const p of products) {
        const exists = await client.query(
          "SELECT 1 FROM Products WHERE Name = $1 AND Seller_ID = $2",
          [p.name, sellerId]
        );
        if (exists.rows.length > 0) continue;

        await client.query(
          `INSERT INTO Products (Seller_ID, Category_ID, Name, Description, Unit_Price, Stock_Quantity, Condition_State)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sellerId, categoryIds[p.cat], p.name, p.desc, p.price, p.stock, p.condition]
        );
        totalInserted++;
      }
    }

    await client.query("COMMIT");
    console.log(`\nDone! Inserted ${totalInserted} products across 3 sellers.`);
    console.log("Seller login password: Seller@123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
