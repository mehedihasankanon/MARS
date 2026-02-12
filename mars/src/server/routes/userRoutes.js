const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/profile", authenticateToken, userController.getProfile);
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.getAllUsers,
);
router.get("/:id", authenticateToken, userController.getUserById);

module.exports = router;
