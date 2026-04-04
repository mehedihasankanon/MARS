const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
const bcrypt = require("bcryptjs");
const pool = require("./db.js");

const imageUrl = (query) => {
  const safeQuery = encodeURIComponent(String(query).trim().toLowerCase());
  return `https://loremflickr.com/1200/800/${safeQuery}?lock=${safeQuery}`;
};

const rolePasswords = {
  admin: "admin123",
  seller: "seller123",
  customer: "cust123",
};

const adminSeed = [
  { username: "adminalpha", email: "admin.alpha@mars.com", first: "Ava", last: "Rahman", phone: "01732520001" },
  { username: "adminbeta", email: "admin.beta@mars.com", first: "Noah", last: "Khan", phone: "01732520002" },
  { username: "admingamma", email: "admin.gamma@mars.com", first: "Mia", last: "Sarkar", phone: "01732520003" },
];

const sellerSeed = [
  { username: "techworld", email: "techworld@mars.com", first: "Alex", last: "Chen", phone: "01732520101", shop: "TechWorld Store", rating: 4.8 },
  { username: "urbanstyle", email: "urbanstyle@mars.com", first: "Maya", last: "Johnson", phone: "01732520202", shop: "Urban Style Co.", rating: 4.6 },
  { username: "bookworm", email: "bookworm@mars.com", first: "Liam", last: "Patel", phone: "01732520303", shop: "The Bookworm", rating: 4.9 },
  { username: "homecraft", email: "homecraft@mars.com", first: "Sophia", last: "Ali", phone: "01732520404", shop: "HomeCraft Studio", rating: 4.5 },
  { username: "fitzone", email: "fitzone@mars.com", first: "Ethan", last: "Das", phone: "01732520505", shop: "FitZone Supply", rating: 4.7 },
  { username: "playhub", email: "playhub@mars.com", first: "Isla", last: "Nair", phone: "01732520606", shop: "PlayHub Toys", rating: 4.4 },
  { username: "beautybar", email: "beautybar@mars.com", first: "Zara", last: "Rahman", phone: "01732520707", shop: "Beauty Bar", rating: 4.6 },
  { username: "autozone", email: "autozone@mars.com", first: "Ryan", last: "Mitra", phone: "01732520808", shop: "AutoZone Pro", rating: 4.3 },
  { username: "officepro", email: "officepro@mars.com", first: "Nora", last: "Hossain", phone: "01732520909", shop: "OfficePro Mart", rating: 4.7 },
  { username: "greenmarket", email: "greenmarket@mars.com", first: "Omar", last: "Farooque", phone: "01732521010", shop: "GreenMarket Daily", rating: 4.5 },
];

const customerSeed = [
  { username: "custava", email: "ava@mars.com", first: "Ava", last: "Ahmed", phone: "01732521101" },
  { username: "custben", email: "ben@mars.com", first: "Ben", last: "Roy", phone: "01732521102" },
  { username: "custchloe", email: "chloe@mars.com", first: "Chloe", last: "Saha", phone: "01732521103" },
  { username: "custdan", email: "dan@mars.com", first: "Dan", last: "Karim", phone: "01732521104" },
  { username: "custeva", email: "eva@mars.com", first: "Eva", last: "Miah", phone: "01732521105" },
  { username: "custfahim", email: "fahim@mars.com", first: "Fahim", last: "Haque", phone: "01732521106" },
  { username: "custgina", email: "gina@mars.com", first: "Gina", last: "Khan", phone: "01732521107" },
  { username: "custharry", email: "harry@mars.com", first: "Harry", last: "Chowdhury", phone: "01732521108" },
  { username: "zarif", email: "zarif@mars.com", first: "Zarif", last: "Mahir", phone: "01732521109" },
  { username: "kanon", email: "kanon@mars.com", first: "Kanon", last: "Mehedi", phone: "01732521110" },
];

const categorySeed = [
  { name: "Electronics", desc: "Phones, laptops, accessories, and smart devices", image: imageUrl("electronics gadgets") },
  { name: "Clothing", desc: "Apparel, shoes, and wearable accessories", image: imageUrl("fashion clothing") },
  { name: "Home & Garden", desc: "Furniture, decor, and household essentials", image: imageUrl("home decor") },
  { name: "Books", desc: "Fiction, non-fiction, and learning materials", image: imageUrl("books reading") },
  { name: "Sports & Outdoors", desc: "Fitness, travel, and outdoor gear", image: imageUrl("sports equipment") },
  { name: "Toys & Games", desc: "Games, puzzles, and family entertainment", image: imageUrl("toys games") },
  { name: "Beauty & Personal Care", desc: "Skincare, grooming, and wellness essentials", image: imageUrl("beauty products") },
  { name: "Automotive", desc: "Car care, accessories, and maintenance tools", image: imageUrl("car accessories") },
  { name: "Office Supplies", desc: "Work-from-home, stationery, and productivity gear", image: imageUrl("office supplies") },
  { name: "Grocery", desc: "Pantry staples, beverages, and everyday food items", image: imageUrl("grocery store") },
];

const catalog = [
  {
    seller: "techworld",
    products: [
      { name: "Wireless Bluetooth Headphones", desc: "Premium noise-cancelling headphones with immersive sound and long battery life.", price: 89.99, stock: 45, condition: "New", category: "Electronics", images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"] },
      { name: "Smartphone 128GB Unlocked", desc: "Latest smartphone with 128GB storage, unlocked for any carrier.", price: 699.00, stock: 22, condition: "New", category: "Electronics", images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80"] },
      { name: "4K Action Camera", desc: "Compact 4K action camera for adventure and sports recording.", price: 129.50, stock: 56, condition: "New", category: "Electronics", images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80"] },
      { name: "Smartwatch with Heart Rate Monitor", desc: "Feature-rich smartwatch with fitness tracking and health monitoring.", price: 199.99, stock: 38, condition: "New", category: "Electronics", images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"] },
    ],
  },
  {
    seller: "urbanstyle",
    products: [
      { name: "Classic White Cotton T-Shirt", desc: "Versatile white cotton t-shirt perfect for everyday casual wear.", price: 15.99, stock: 120, condition: "New", category: "Clothing", images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"] },
      { name: "Men's Vintage Denim Jacket", desc: "Timeless vintage denim jacket with a classic rock-and-roll appeal.", price: 59.90, stock: 48, condition: "New", category: "Clothing", images: ["https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=500&q=80"] },
      { name: "Women's Floral Summer Dress", desc: "Light and breezy floral summer dress perfect for warm weather.", price: 45.00, stock: 64, condition: "New", category: "Clothing", images: ["https://images.unsplash.com/photo-1515347619362-67fd1397b25e?w=500&q=80"] },
      { name: "Lightweight Running Sneakers", desc: "Breathable running sneakers designed for comfort and performance.", price: 85.50, stock: 72, condition: "New", category: "Clothing", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"] },
    ],
  },
  {
    seller: "bookworm",
    products: [
      { name: "The Art of Computer Programming", desc: "Comprehensive and foundational computer science literature.", price: 45.99, stock: 62, condition: "New", category: "Books", images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80"] },
      { name: "History of the World (Hardcover)", desc: "Detailed hardcover chronicle of world history and civilizations.", price: 32.50, stock: 51, condition: "New", category: "Books", images: ["https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80"] },
      { name: "Sci-Fi Anthology Paperback", desc: "Collection of classic science fiction short stories and tales.", price: 14.99, stock: 88, condition: "New", category: "Books", images: ["https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?w=500&q=80"] },
      { name: "Leatherbound Blank Journal", desc: "Premium leatherbound journal for writing and personal reflection.", price: 18.00, stock: 75, condition: "New", category: "Books", images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80"] },
    ],
  },
  {
    seller: "homecraft",
    products: [
      { name: "Matte Ceramic Coffee Mug", desc: "Minimalist matte ceramic mug perfect for morning coffee rituals.", price: 12.99, stock: 95, condition: "New", category: "Home & Garden", images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80"] },
      { name: "Indoor Potted Succulent", desc: "Low-maintenance succulent plant in a decorative pot for indoor spaces.", price: 24.50, stock: 68, condition: "New", category: "Home & Garden", images: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80"] },
      { name: "Boho Style Throw Pillows (Set of 2)", desc: "Set of two bohemian-style pillows to add warmth and character to any room.", price: 34.00, stock: 52, condition: "New", category: "Home & Garden", images: ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=500&q=80"] },
      { name: "Minimalist Wooden Dining Chair", desc: "Clean-lined wooden dining chair combining comfort and modern aesthetics.", price: 110.00, stock: 28, condition: "New", category: "Home & Garden", images: ["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&q=80"] },
    ],
  },
  {
    seller: "fitzone",
    products: [
      { name: "Non-Slip Yoga Mat with Strap", desc: "Durable yoga mat with non-slip surface and convenient carrying strap.", price: 29.99, stock: 84, condition: "New", category: "Sports & Outdoors", images: ["https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&q=80"] },
      { name: "Insulated Stainless Steel Water Bottle", desc: "Temperature-retaining water bottle perfect for hot or cold beverages.", price: 22.00, stock: 110, condition: "New", category: "Sports & Outdoors", images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80"] },
      { name: "Official Size Leather Basketball", desc: "Regulation-size leather basketball suitable for professional and recreational play.", price: 35.50, stock: 47, condition: "New", category: "Sports & Outdoors", images: ["https://images.unsplash.com/photo-1519861531473-920026076fb1?w=500&q=80"] },
      { name: "2-Person Camping Tent", desc: "Lightweight and waterproof tent designed for comfortable camping expeditions.", price: 149.99, stock: 19, condition: "New", category: "Sports & Outdoors", images: ["https://images.unsplash.com/photo-1504280390467-3335588373b5?w=500&q=80"] },
    ],
  },
  {
    seller: "playhub",
    products: [
      { name: "Classic Rubiks Cube 3x3", desc: "Iconic puzzle cube offering hours of brain-challenging entertainment.", price: 11.99, stock: 142, condition: "New", category: "Toys & Games", images: ["https://images.unsplash.com/photo-1591991564021-0662a8573199?w=500&q=80"] },
      { name: "Natural Wooden Building Blocks", desc: "Set of natural wooden blocks encouraging creative building and learning.", price: 26.00, stock: 76, condition: "New", category: "Toys & Games", images: ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80"] },
      { name: "Soft Plush Teddy Bear", desc: "Cuddly plush teddy bear perfect as a comfort companion or collectible.", price: 19.50, stock: 98, condition: "New", category: "Toys & Games", images: ["https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=500&q=80"] },
      { name: "Strategy Board Game Set", desc: "Engaging strategy board game for family game nights and social gatherings.", price: 42.99, stock: 35, condition: "New", category: "Toys & Games", images: ["https://images.unsplash.com/photo-1610890716175-34351658b1aa?w=500&q=80"] },
    ],
  },
  {
    seller: "beautybar",
    products: [
      { name: "Organic Night Skincare Cream", desc: "Natural night cream infused with organic ingredients for deep hydration.", price: 28.99, stock: 67, condition: "New", category: "Beauty & Personal Care", images: ["https://images.unsplash.com/photo-1611077543884-6a9876251b6a?w=500&q=80"] },
      { name: "Long-Lasting Matte Lipstick", desc: "Long-wearing matte lipstick offering vibrant color without flaking.", price: 16.50, stock: 89, condition: "New", category: "Beauty & Personal Care", images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80"] },
      { name: "Signature Fragrance Perfume", desc: "Distinctive perfume with a blend of floral and woody aromatic notes.", price: 65.00, stock: 41, condition: "New", category: "Beauty & Personal Care", images: ["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80"] },
      { name: "Eco-Friendly Bamboo Toothbrush Set", desc: "Sustainable bamboo toothbrush set promoting eco-conscious oral care.", price: 10.99, stock: 125, condition: "New", category: "Beauty & Personal Care", images: ["https://images.unsplash.com/photo-1600180758850-66de511ea636?w=500&q=80"] },
    ],
  },
  {
    seller: "autozone",
    products: [
      { name: "Premium Car Wash & Wax Kit", desc: "Complete car care kit with professional-grade wash and protective wax.", price: 39.99, stock: 58, condition: "New", category: "Automotive", images: ["https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=500&q=80"] },
      { name: "Portable Tire Air Compressor", desc: "Compact air compressor for quick and convenient tire inflation anywhere.", price: 45.00, stock: 73, condition: "New", category: "Automotive", images: ["https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=500&q=80"] },
      { name: "Genuine Leather Steering Wheel Cover", desc: "Premium leather steering wheel cover for enhanced grip and comfort.", price: 25.50, stock: 82, condition: "New", category: "Automotive", images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&q=80"] },
      { name: "Ultra-Bright LED Headlight Bulbs", desc: "High-intensity LED bulbs providing superior visibility and modern styling.", price: 55.00, stock: 54, condition: "New", category: "Automotive", images: ["https://images.unsplash.com/photo-1552554746-8800ba203e0e?w=500&q=80"] },
    ],
  },
  {
    seller: "officepro",
    products: [
      { name: "Wooden Desk Organizer", desc: "Multi-compartment wooden organizer for keeping desk supplies neatly arranged.", price: 21.99, stock: 91, condition: "New", category: "Office Supplies", images: ["https://images.unsplash.com/photo-1505015920881-0f83c2f7c95e?w=500&q=80"] },
      { name: "Executive Fountain Pen", desc: "Refined fountain pen with smooth writing motion and elegant design.", price: 34.50, stock: 63, condition: "New", category: "Office Supplies", images: ["https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500&q=80"] },
      { name: "Assorted Metal Paper Clips Box", desc: "Box of durable metal paper clips in assorted colors and sizes.", price: 4.99, stock: 200, condition: "New", category: "Office Supplies", images: ["https://images.unsplash.com/photo-1598226066265-515438a3eb26?w=500&q=80"] },
      { name: "Ergonomic Wireless Mouse", desc: "Wrist-friendly wireless mouse designed for all-day comfort and productivity.", price: 29.99, stock: 106, condition: "New", category: "Office Supplies", images: ["https://images.unsplash.com/photo-1615663245857-ac1eeb536bfb?w=500&q=80"] },
    ],
  },
  {
    seller: "greenmarket",
    products: [
      { name: "Fresh Organic Red Apples (1kg)", desc: "Hand-picked organic red apples, crisp and sweet for healthy snacking.", price: 6.99, stock: 152, condition: "New", category: "Grocery", images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=500&q=80"] },
      { name: "Dark Roast Whole Coffee Beans (500g)", desc: "Premium dark roasted whole beans with bold, rich coffee flavor profile.", price: 14.50, stock: 97, condition: "New", category: "Grocery", images: ["https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80"] },
      { name: "Cold-Pressed Extra Virgin Olive Oil", desc: "Cold-pressed olive oil with full-bodied flavor ideal for cooking and dressing.", price: 18.99, stock: 79, condition: "New", category: "Grocery", images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80"] },
      { name: "Freshly Baked Artisan Sourdough Bread", desc: "Warming sourdough bread with tangy flavor and crusty exterior crust.", price: 5.50, stock: 164, condition: "New", category: "Grocery", images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80"] },
    ],
  },
];

async function createUser(client, user, password) {
  const result = await client.query(
    `INSERT INTO Users (Username, Email, Password, First_Name, Last_Name, Phone_Number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING User_ID`,
    [user.username, user.email, password, user.first, user.last, user.phone]
  );
  return result.rows[0].user_id;
}

async function cleanDatabase(client) {
  await client.query(`
    TRUNCATE TABLE
      Return_Items,
      Returns,
      Shipment_Status_History,
      Shipments,
      Payments,
      Order_Items,
      Orders,
      Coupons,
      Reviews,
      Questions,
      Wishlists,
      Cart_Items,
      Carts,
      Product_Offers,
      Product_Varieties,
      Product_Images,
      Products,
      Categories,
      Addresses,
      Customers,
      Sellers,
      Admins,
      Users
    RESTART IDENTITY CASCADE;
  `);
}

async function seedUsersAndRoles(client) {
  const passwordMap = {
    admin: await bcrypt.hash(rolePasswords.admin, 10),
    seller: await bcrypt.hash(rolePasswords.seller, 10),
    customer: await bcrypt.hash(rolePasswords.customer, 10),
  };

  const adminIds = [];
  for (const admin of adminSeed) {
    const userId = await createUser(client, admin, passwordMap.admin);
    await client.query("INSERT INTO Admins (Admin_ID) VALUES ($1)", [userId]);
    adminIds.push(userId);
  }

  const sellerIds = [];
  for (let index = 0; index < sellerSeed.length; index++) {
    const seller = sellerSeed[index];
    const userId = await createUser(client, seller, passwordMap.seller);
    await client.query("INSERT INTO Sellers (Seller_ID, Shop_Name, Rating, Approved_By_Admin_ID, Authorization_Date) VALUES ($1, $2, $3, $4, CURRENT_DATE)", [
      userId,
      seller.shop,
      seller.rating,
      adminIds[index % adminIds.length],
    ]);
    sellerIds.push(userId);
  }

  const customerIds = [];
  for (const customer of customerSeed) {
    const userId = await createUser(client, customer, passwordMap.customer);
    await client.query("INSERT INTO Customers (Customer_ID, Loyalty_Points) VALUES ($1, $2)", [userId, Math.floor(Math.random() * 250)]);
    customerIds.push(userId);
  }

  return { adminIds, sellerIds, customerIds };
}

async function seedCategories(client, adminIds) {
  const categoryIds = {};
  for (const category of categorySeed) {
    const result = await client.query(
      `INSERT INTO Categories (Name, Description, Image, Updated_By_Admin_ID)
       VALUES ($1, $2, $3, $4)
       RETURNING Category_ID, Name`,
      [category.name, category.desc, category.image, adminIds[0]]
    );
    categoryIds[result.rows[0].name] = result.rows[0].category_id;
  }
  return categoryIds;
}

async function seedAddressesAndCarts(client, customerIds) {
  const addresses = [
    { house: "12/A", street: "Lake Road", city: "Dhaka", zip: "1205" },
    { house: "45", street: "Dhanmondi 27", city: "Dhaka", zip: "1209" },
    { house: "8/B", street: "Avenue 5", city: "Chattogram", zip: "4000" },
    { house: "19", street: "KDA Avenue", city: "Khulna", zip: "9100" },
    { house: "33", street: "Station Road", city: "Rajshahi", zip: "6100" },
    { house: "7/C", street: "Zindabazar", city: "Sylhet", zip: "3100" },
    { house: "21", street: "Mirpur 10", city: "Dhaka", zip: "1216" },
    { house: "55", street: "Shaheb Bazar", city: "Rajshahi", zip: "6100" },
    { house: "11", street: "Banasree Main Road", city: "Dhaka", zip: "1219" },
    { house: "4/D", street: "New Market", city: "Dhaka", zip: "1205" },
  ];

  for (let index = 0; index < customerIds.length; index++) {
    const customerId = customerIds[index];
    const address = addresses[index % addresses.length];

    await client.query(
      `INSERT INTO Addresses (User_ID, House, Street_Road, City, Zip_Code, Address_Type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customerId, address.house, address.street, address.city, address.zip, "Home"]
    );

    await client.query(
      `INSERT INTO Carts (Customer_ID, Total_Amount)
       VALUES ($1, 0.00)`,
      [customerId]
    );
  }
}

async function seedProducts(client, sellerIds, categoryIds) {
  let productCount = 0;
  let imageCount = 0;

  for (const sellerGroup of catalog) {
    const sellerIndex = sellerSeed.findIndex((seller) => seller.username === sellerGroup.seller);
    const sellerId = sellerIds[sellerIndex];

    for (const product of sellerGroup.products) {
      const productResult = await client.query(
        `INSERT INTO Products (Seller_ID, Category_ID, Name, Description, Unit_Price, Stock_Quantity, Condition_State)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING Product_ID`,
        [
          sellerId,
          categoryIds[product.category],
          product.name,
          product.desc,
          product.price,
          product.stock,
          product.condition,
        ]
      );

      const productId = productResult.rows[0].product_id;
      productCount++;

      for (const url of product.images.slice(0, 2)) {
        await client.query(
          `INSERT INTO Product_Images (Product_ID, Image_URL)
           VALUES ($1, $2)`,
          [productId, url]
        );
        imageCount++;
      }
    }
  }

  return { productCount, imageCount };
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (process.env.SKIP_CLEANUP !== "1") {
      await cleanDatabase(client);
    }

    const { adminIds, sellerIds, customerIds } = await seedUsersAndRoles(client);
    const categoryIds = await seedCategories(client, adminIds);
    await seedAddressesAndCarts(client, customerIds);
    const { productCount, imageCount } = await seedProducts(client, sellerIds, categoryIds);

    await client.query("COMMIT");
    console.log("Database reset complete.");
    console.log(`Seeded ${adminIds.length} admins, ${sellerIds.length} sellers, ${customerIds.length} customers, ${Object.keys(categoryIds).length} categories, ${productCount} products, and ${imageCount} images.`);
    console.log("Admin password: admin123");
    console.log("Seller password: seller123");
    console.log("Customer password: cust123");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Full database seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();