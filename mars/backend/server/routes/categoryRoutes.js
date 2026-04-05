const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { categoryUpload } = require("../config/cloudinary");

router.get("/", categoryController.getAllCategories);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  categoryUpload.single("imageFile"),
  categoryController.createCategory
);

router.put(
  "/:name",
  authenticateToken,
  authorizeRoles("admin"),
  categoryUpload.single("imageFile"),
  categoryController.updateCategory
);

router.delete(
  "/:name",
  authenticateToken,
  authorizeRoles("admin"),
  categoryController.deleteCategory
);

module.exports = router;
