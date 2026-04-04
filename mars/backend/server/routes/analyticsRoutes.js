const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get(
  "/top-sellers",
  authenticateToken,
  authorizeRoles("admin"),
  analyticsController.getTopSellers,
);
router.get(
  "/best-selling",
  authenticateToken,
  authorizeRoles("admin"),
  analyticsController.getBestSellingProducts,
);
router.get(
  "/categories",
  authenticateToken,
  authorizeRoles("admin"),
  analyticsController.getCategoryAnalytics,
);
router.get(
  "/platform",
  authenticateToken,
  authorizeRoles("admin"),
  analyticsController.getPlatformStats,
);
router.get(
  "/seller-stats",
  authenticateToken,
  authorizeRoles("seller"),
  analyticsController.getSellerStats,
);

module.exports = router;
