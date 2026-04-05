const express = require("express");
const router = express.Router();
const varietyController = require("../controllers/varietyController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/product/:productId", varietyController.getVarietiesByProduct);

router.post(
  "/product/:productId",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  varietyController.createVariety,
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  varietyController.deleteVariety,
);

module.exports = router;
