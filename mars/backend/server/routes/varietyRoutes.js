const express = require("express");
const router = express.Router();
const varietyController = require("../controllers/varietyController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

// Public — list all varieties for a product
router.get("/product/:productId", varietyController.getVarietiesByProduct);

// Seller or admin — add a variety to a product
router.post(
  "/product/:productId",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  varietyController.createVariety,
);

// Seller or admin — remove a variety
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  varietyController.deleteVariety,
);

module.exports = router;
