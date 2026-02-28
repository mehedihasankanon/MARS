const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authenticateToken } = require("../middleware/jwt");

// All address routes require authentication
router.get("/", authenticateToken, addressController.getMyAddresses);
router.post("/", authenticateToken, addressController.createAddress);

module.exports = router;
