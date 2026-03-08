const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/", categoryController.getAllCategories);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  categoryController.createCategory
);

router.put(
  "/:name",
  authenticateToken,
  authorizeRoles("admin"),
  categoryController.updateCategory
);

router.delete(
  "/:name",
  authenticateToken,
  authorizeRoles("admin"),
  categoryController.deleteCategory
);

module.exports = router;
