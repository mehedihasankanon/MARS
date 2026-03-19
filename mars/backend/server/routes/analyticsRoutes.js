const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authenticateToken } = require("../middleware/jwt");

// All analytics endpoints require authentication
router.get("/top-sellers", authenticateToken, analyticsController.getTopSellers);
router.get("/best-selling", authenticateToken, analyticsController.getBestSellingProducts);
router.get("/categories", authenticateToken, analyticsController.getCategoryAnalytics);
router.get("/platform", authenticateToken, analyticsController.getPlatformStats);

module.exports = router;
