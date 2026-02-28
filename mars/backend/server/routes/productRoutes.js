const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productController.createProduct,
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productController.deleteProduct,
);

module.exports = router;
