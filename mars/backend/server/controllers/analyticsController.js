const pool = require("../../../database/db");

// Complex Query 1: Top sellers by total revenue across all their products
// Joins: Orders → Order_Items → Products → Sellers → Users
// Aggregation: SUM, COUNT, GROUP BY, ORDER BY
exports.getTopSellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.Username as seller_name,
        u.Profile_Picture as profile_picture,
        s.Rating as seller_rating,
        COUNT(DISTINCT o.Order_ID) as total_orders,
        COUNT(DISTINCT p.Product_ID) as total_products,
        SUM(oi.Net_Price) as total_revenue,
        ROUND(AVG(r.Rating), 2) as avg_product_rating
      FROM Sellers s
      JOIN Users u ON s.Seller_ID = u.User_ID
      JOIN Products p ON p.Seller_ID = s.Seller_ID
      LEFT JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
      LEFT JOIN Orders o ON o.Order_ID = oi.Order_ID AND o.Order_Status != 'Cancelled'
      LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
      GROUP BY s.Seller_ID, u.Username, u.Profile_Picture, s.Rating
      HAVING COUNT(DISTINCT oi.Order_ID) > 0
      ORDER BY total_revenue DESC NULLS LAST
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching top sellers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Complex Query 2: Best-selling products with revenue, ratings, and category info
// Joins: Products → Order_Items → Categories → Reviews → Product_Images
// Aggregation: SUM, COUNT, AVG, GROUP BY
exports.getBestSellingProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.Product_ID as product_id,
        p.Name as product_name,
        c.Name as category_name,
        u.Username as seller_name,
        SUM(oi.Quantity) as total_sold,
        SUM(oi.Net_Price) as total_revenue,
        ROUND(AVG(r.Rating), 2) as avg_rating,
        COUNT(DISTINCT r.Review_ID) as review_count,
        (SELECT pi.Image_URL FROM Product_Images pi WHERE pi.Product_ID = p.Product_ID LIMIT 1) as image_url
      FROM Products p
      JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
      JOIN Orders o ON o.Order_ID = oi.Order_ID AND o.Order_Status != 'Cancelled'
      JOIN Categories c ON c.Category_ID = p.Category_ID
      JOIN Users u ON u.User_ID = p.Seller_ID
      LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
      GROUP BY p.Product_ID, p.Name, c.Name, u.Username
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Complex Query 3: Category-wise sales analytics
// Joins: Categories → Products → Order_Items → Orders → Reviews
// Aggregation: SUM, COUNT, AVG, GROUP BY
exports.getCategoryAnalytics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.Category_ID as category_id,
        c.Name as category_name,
        COUNT(DISTINCT p.Product_ID) as product_count,
        COUNT(DISTINCT CASE WHEN o.Order_Status != 'Cancelled' THEN o.Order_ID END) as total_orders,
        COALESCE(SUM(CASE WHEN o.Order_Status != 'Cancelled' THEN oi.Net_Price END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN o.Order_Status != 'Cancelled' THEN oi.Quantity END), 0) as items_sold,
        ROUND(AVG(r.Rating), 2) as avg_rating
      FROM Categories c
      LEFT JOIN Products p ON p.Category_ID = c.Category_ID
      LEFT JOIN Order_Items oi ON oi.Product_ID = p.Product_ID
      LEFT JOIN Orders o ON o.Order_ID = oi.Order_ID
      LEFT JOIN Reviews r ON r.Product_ID = p.Product_ID
      GROUP BY c.Category_ID, c.Name
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category analytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Complex Query 4: Platform-wide overview stats
// Joins multiple tables with subqueries and aggregation
exports.getPlatformStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) as total_users,
        (SELECT COUNT(*) FROM Sellers) as total_sellers,
        (SELECT COUNT(*) FROM Products) as total_products,
        (SELECT COUNT(*) FROM Orders WHERE Order_Status != 'Cancelled') as total_orders,
        (SELECT COALESCE(SUM(Total_Amount), 0) FROM Orders WHERE Order_Status != 'Cancelled') as total_revenue,
        (SELECT COUNT(*) FROM Reviews) as total_reviews,
        (SELECT ROUND(AVG(Rating), 2) FROM Reviews) as platform_avg_rating,
        (SELECT COUNT(*) FROM Orders WHERE Order_Status = 'Pending') as pending_orders,
        (SELECT COUNT(*) FROM Orders WHERE Order_Status = 'Delivered') as delivered_orders,
        (SELECT COUNT(*) FROM Returns WHERE Status = 'Pending') as pending_returns
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
