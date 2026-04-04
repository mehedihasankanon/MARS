const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", authenticateToken, authController.changePassword);

router.put("/add-admin", authenticateToken, authorizeRoles("admin"), authController.addAdmin);

module.exports = router;
