const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { productUpload } = require("../config/cloudinary");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productController.createProduct,
);
router.post(
  "/:id/images",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productUpload.array("images", 5),
  productController.uploadProductImages,
);
router.delete(
  "/:id/images/:imageId",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  productController.deleteProductImage,
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
