const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

// Public — anyone can list categories
router.get("/", categoryController.getAllCategories);

// Admin only — create a new category
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  categoryController.createCategory
);

module.exports = router;
