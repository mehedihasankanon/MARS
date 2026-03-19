const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const { authenticateToken } = require("../middleware/jwt");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.put("/change-password", authenticateToken, authController.changePassword);

module.exports = router;
