const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
const bcrypt = require("bcryptjs");
const pool = require("./db.js");

const onlineImage = (query) =>
  `https://source.unsplash.com/featured/1200x800/?${encodeURIComponent(query)}`;

const categorySeed = [
  { name: "Electronics", desc: "Phones, laptops, accessories, and smart devices" },
  { name: "Clothing", desc: "Apparel, shoes, and wearable accessories" },
  { name: "Home & Garden", desc: "Furniture, decor, and household essentials" },
  { name: "Books", desc: "Fiction, non-fiction, and learning materials" },
  { name: "Sports & Outdoors", desc: "Fitness, travel, and outdoor gear" },
  { name: "Toys & Games", desc: "Games, puzzles, and family entertainment" },
];

const sellers = [
  {
    username: "techworld",
    email: "techworld@mars.com",
    first: "Alex",
    last: "Chen",
    phone: "555-0101",
    shop: "TechWorld Store",
  },
  {
    username: "urbanstyle",
    email: "urbanstyle@mars.com",
    first: "Maya",
    last: "Johnson",
    phone: "555-0202",
    shop: "Urban Style Co.",
  },
  {
    username: "bookworm",
    email: "bookworm@mars.com",
    first: "Liam",
    last: "Patel",
    phone: "555-0303",
    shop: "The Bookworm",
  },
];

const catalog = [
  {
    seller: "techworld",
    products: [
      {
        name: "Sony WF-1000XM5 Wireless Earbuds",
        desc: "Premium noise-cancelling earbuds with long battery life and a compact charging case.",
        price: 299.99,
        stock: 48,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("wireless earbuds"), onlineImage("headphones")],
      },
      {
        name: "Keychron K8 Pro Mechanical Keyboard",
        desc: "Hot-swappable mechanical keyboard with RGB lighting and wireless connectivity.",
        price: 129.99,
        stock: 72,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("mechanical keyboard"), onlineImage("gaming keyboard")],
      },
      {
        name: "Anker PowerCore 20K Portable Charger",
        desc: "High-capacity USB-C power bank with fast charging support for travel and daily use.",
        price: 49.99,
        stock: 120,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("power bank"), onlineImage("portable charger")],
      },
      {
        name: "Garmin Venu Sq 2 Smartwatch",
        desc: "Fitness-focused smartwatch with heart-rate tracking, GPS, and health metrics.",
        price: 249.99,
        stock: 34,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("smartwatch"), onlineImage("fitness watch")],
      },
      {
        name: "Anker 7-in-1 USB-C Hub",
        desc: "Compact multi-port adapter for modern laptops with HDMI, USB, and SD card support.",
        price: 59.99,
        stock: 88,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("usb hub"), onlineImage("laptop docking station")],
      },
      {
        name: "Bowflex SelectTech Adjustable Dumbbells",
        desc: "Space-saving adjustable dumbbells for home workouts and progressive strength training.",
        price: 399.99,
        stock: 16,
        condition: "New",
        cat: "Electronics",
        images: [onlineImage("adjustable dumbbells"), onlineImage("home gym equipment")],
      },
    ],
  },
  {
    seller: "urbanstyle",
    products: [
      {
        name: "Levi's Trucker Denim Jacket",
        desc: "Classic denim jacket with a timeless fit and durable cotton blend construction.",
        price: 89.99,
        stock: 62,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("denim jacket"), onlineImage("streetwear jacket")],
      },
      {
        name: "Converse Chuck Taylor All Star Sneakers",
        desc: "Iconic canvas sneakers for everyday wear with a lightweight rubber sole.",
        price: 64.99,
        stock: 95,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("canvas sneakers"), onlineImage("casual sneakers")],
      },
      {
        name: "Nike Club Fleece Hoodie",
        desc: "Soft fleece hoodie with a relaxed fit for comfort, lounging, and light training.",
        price: 74.99,
        stock: 78,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("hoodie"), onlineImage("sweatshirt")],
      },
      {
        name: "Ray-Ban Wayfarer Sunglasses",
        desc: "Everyday sunglasses with a bold frame and UV protection for outdoor wear.",
        price: 159.99,
        stock: 44,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("sunglasses"), onlineImage("fashion eyewear")],
      },
      {
        name: "Carhartt Knit Beanie",
        desc: "Warm winter beanie with a clean everyday style and a soft stretch fit.",
        price: 24.99,
        stock: 110,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("beanie"), onlineImage("winter hat")],
      },
      {
        name: "Lululemon Align Yoga Pants",
        desc: "High-rise performance leggings built for comfort, movement, and activewear styling.",
        price: 98.99,
        stock: 56,
        condition: "New",
        cat: "Clothing",
        images: [onlineImage("athletic leggings"), onlineImage("activewear")],
      },
      {
        name: "Minimalist LED Desk Lamp",
        desc: "Modern adjustable desk lamp with soft light and a compact metal base.",
        price: 39.99,
        stock: 85,
        condition: "New",
        cat: "Home & Garden",
        images: [onlineImage("desk lamp"), onlineImage("minimalist lamp")],
      },
      {
        name: "Vancasso Ceramic Plant Pot Set",
        desc: "Decorative ceramic planters with drainage holes for indoor greenery.",
        price: 34.99,
        stock: 64,
        condition: "New",
        cat: "Home & Garden",
        images: [onlineImage("ceramic plant pot"), onlineImage("indoor plants")],
      },
      {
        name: "Woven Throw Blanket",
        desc: "Soft woven throw blanket for living rooms, bedrooms, and cozy evenings.",
        price: 44.99,
        stock: 58,
        condition: "New",
        cat: "Home & Garden",
        images: [onlineImage("throw blanket"), onlineImage("cozy blanket")],
      },
      {
        name: "Acacia Serving Tray",
        desc: "Elegant wood serving tray for coffee tables, kitchens, and casual hosting.",
        price: 29.99,
        stock: 91,
        condition: "New",
        cat: "Home & Garden",
        images: [onlineImage("wood tray"), onlineImage("serving tray")],
      },
    ],
  },
  {
    seller: "bookworm",
    products: [
      {
        name: "Atomic Habits Hardcover",
        desc: "Popular habit-building book with practical strategies for everyday improvement.",
        price: 24.99,
        stock: 150,
        condition: "New",
        cat: "Books",
        images: [onlineImage("books"), onlineImage("hardcover book")],
      },
      {
        name: "Clean Code",
        desc: "Classic software engineering title covering readable code, design, and craftsmanship.",
        price: 29.99,
        stock: 132,
        condition: "New",
        cat: "Books",
        images: [onlineImage("programming book"), onlineImage("bookshelf")],
      },
      {
        name: "The Pragmatic Programmer",
        desc: "Essential developer reference for practical software development habits and techniques.",
        price: 27.99,
        stock: 118,
        condition: "New",
        cat: "Books",
        images: [onlineImage("programming book"), onlineImage("books")],
      },
      {
        name: "Sapiens Hardcover",
        desc: "Best-selling history book exploring the development of humankind and society.",
        price: 26.99,
        stock: 84,
        condition: "New",
        cat: "Books",
        images: [onlineImage("history book"), onlineImage("hardcover book")],
      },
      {
        name: "Deep Work",
        desc: "Focus and productivity book for deep concentration and meaningful work habits.",
        price: 21.99,
        stock: 96,
        condition: "New",
        cat: "Books",
        images: [onlineImage("books"), onlineImage("study desk")],
      },
      {
        name: "The Psychology of Money",
        desc: "Accessible personal finance book about decision-making, wealth, and long-term thinking.",
        price: 23.99,
        stock: 101,
        condition: "New",
        cat: "Books",
        images: [onlineImage("finance book"), onlineImage("books")],
      },
      {
        name: "Yoga Mat Set",
        desc: "Cushioned mat set for home workouts, stretching, and mobility training.",
        price: 49.99,
        stock: 68,
        condition: "New",
        cat: "Sports & Outdoors",
        images: [onlineImage("yoga mat"), onlineImage("fitness mat")],
      },
      {
        name: "Resistance Band Kit",
        desc: "Portable resistance band set for strength workouts, rehab, and travel fitness.",
        price: 19.99,
        stock: 142,
        condition: "New",
        cat: "Sports & Outdoors",
        images: [onlineImage("resistance bands"), onlineImage("workout equipment")],
      },
      {
        name: "Hiking Backpack",
        desc: "Durable outdoor backpack with multiple compartments for day hikes and trips.",
        price: 79.99,
        stock: 49,
        condition: "New",
        cat: "Sports & Outdoors",
        images: [onlineImage("hiking backpack"), onlineImage("travel backpack")],
      },
      {
        name: "Stainless Steel Water Bottle",
        desc: "Insulated water bottle designed for gym sessions, travel, and everyday hydration.",
        price: 24.99,
        stock: 155,
        condition: "New",
        cat: "Sports & Outdoors",
        images: [onlineImage("water bottle"), onlineImage("insulated bottle")],
      },
      {
        name: "Catan Board Game",
        desc: "Strategy board game for game nights, featuring trade, settlement, and resource management.",
        price: 54.99,
        stock: 40,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("board game"), onlineImage("tabletop game")],
      },
      {
        name: "UNO Card Game",
        desc: "Classic fast-paced card game for families, friends, and casual play.",
        price: 14.99,
        stock: 180,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("card game"), onlineImage("family game")],
      },
      {
        name: "1000-Piece Jigsaw Puzzle",
        desc: "Challenging jigsaw puzzle with scenic artwork for relaxed evenings.",
        price: 18.99,
        stock: 86,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("jigsaw puzzle"), onlineImage("puzzle")],
      },
      {
        name: "LEGO Classic Brick Box",
        desc: "Creative building set with colorful bricks for open-ended play and display.",
        price: 39.99,
        stock: 63,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("lego bricks"), onlineImage("building blocks")],
      },
      {
        name: "Chess Set",
        desc: "Classic board game set with a foldable board and weighted pieces.",
        price: 34.99,
        stock: 74,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("chess set"), onlineImage("board game")],
      },
      {
        name: "Plush Space Explorer Toy",
        desc: "Soft plush character toy for kids and collectors with a playful design.",
        price: 22.99,
        stock: 92,
        condition: "New",
        cat: "Toys & Games",
        images: [onlineImage("plush toy"), onlineImage("stuffed animal")],
      },
    ],
  },
];

async function ensureCategory(client, category) {
  const result = await client.query(
    `INSERT INTO Categories (Name, Description)
     VALUES ($1, $2)
     ON CONFLICT (Name) DO UPDATE SET Description = EXCLUDED.Description,
       Last_Updated_at = CURRENT_TIMESTAMP
     RETURNING Category_ID, Name`,
    [category.name, category.desc]
  );

  return result.rows[0];
}

async function ensureSeller(client, seller) {
  const existing = await client.query(
    "SELECT User_ID FROM Users WHERE username = $1 OR email = $2",
    [seller.username, seller.email]
  );

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].user_id;
    await client.query(
      "INSERT INTO Customers (Customer_ID) VALUES ($1) ON CONFLICT (Customer_ID) DO NOTHING",
      [userId]
    );
    await client.query(
      "INSERT INTO Sellers (Seller_ID, Shop_Name) VALUES ($1, $2) ON CONFLICT (Seller_ID) DO UPDATE SET Shop_Name = EXCLUDED.Shop_Name",
      [userId, seller.shop]
    );
    return userId;
  }

  const hashedPassword = await bcrypt.hash("Seller@123", 10);
  const userRes = await client.query(
    `INSERT INTO Users (Username, Email, Password, First_Name, Last_Name, Phone_Number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING User_ID`,
    [seller.username, seller.email, hashedPassword, seller.first, seller.last, seller.phone]
  );

  const userId = userRes.rows[0].user_id;
  await client.query("INSERT INTO Customers (Customer_ID) VALUES ($1)", [userId]);
  await client.query(
    "INSERT INTO Sellers (Seller_ID, Shop_Name) VALUES ($1, $2)",
    [userId, seller.shop]
  );

  return userId;
}

async function insertProductImages(client, productId, imageUrls) {
  const uniqueUrls = [...new Set((imageUrls || []).filter(Boolean))].slice(0, 5);

  for (const imageUrl of uniqueUrls) {
    const exists = await client.query(
      "SELECT 1 FROM Product_Images WHERE Product_ID = $1 AND Image_URL = $2",
      [productId, imageUrl]
    );

    if (exists.rows.length > 0) continue;

    await client.query(
      "INSERT INTO Product_Images (Product_ID, Image_URL) VALUES ($1, $2)",
      [productId, imageUrl]
    );
  }
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoryIds = {};
    for (const category of categorySeed) {
      const row = await ensureCategory(client, category);
      categoryIds[row.name] = row.category_id;
    }

    const sellerIds = {};
    for (const seller of sellers) {
      sellerIds[seller.username] = await ensureSeller(client, seller);
    }

    let insertedProducts = 0;
    let insertedImages = 0;

    for (const sellerGroup of catalog) {
      const sellerId = sellerIds[sellerGroup.seller];

      for (const product of sellerGroup.products) {
        const existing = await client.query(
          "SELECT Product_ID FROM Products WHERE Name = $1 AND Seller_ID = $2",
          [product.name, sellerId]
        );

        let productId;
        if (existing.rows.length > 0) {
          productId = existing.rows[0].product_id;
        } else {
          const result = await client.query(
            `INSERT INTO Products (Seller_ID, Category_ID, Name, Description, Unit_Price, Stock_Quantity, Condition_State)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING Product_ID`,
            [
              sellerId,
              categoryIds[product.cat],
              product.name,
              product.desc,
              product.price,
              product.stock,
              product.condition,
            ]
          );
          productId = result.rows[0].product_id;
          insertedProducts++;
        }

        const beforeImages = await client.query(
          "SELECT COUNT(*)::int AS count FROM Product_Images WHERE Product_ID = $1",
          [productId]
        );

        await insertProductImages(client, productId, product.images);

        const afterImages = await client.query(
          "SELECT COUNT(*)::int AS count FROM Product_Images WHERE Product_ID = $1",
          [productId]
        );

        insertedImages += Math.max(0, afterImages.rows[0].count - beforeImages.rows[0].count);
      }
    }

    await client.query("COMMIT");
    console.log(`Done! Seeded ${insertedProducts} new products and ${insertedImages} new images.`);
    console.log("Seller login password: Seller@123");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();