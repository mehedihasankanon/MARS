const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authenticateToken } = require("../middleware/jwt");

router.get("/", authenticateToken, addressController.getMyAddresses);
router.post("/", authenticateToken, addressController.createAddress);
router.put("/:id", authenticateToken, addressController.updateAddress);
router.delete("/:id", authenticateToken, addressController.deleteAddress);

module.exports = router;
