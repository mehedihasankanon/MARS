const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");

const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

// Customers can request returns
router.post("/request", authenticateToken, authorizeRoles("customer", "admin"), returnController.requestReturn);

// Sellers fetch incoming return requests
router.get("/seller", authenticateToken, authorizeRoles("seller", "admin"), returnController.getSellerReturns);

// Sellers approve returns
router.post("/approve/:returnId", authenticateToken, authorizeRoles("seller", "admin"), returnController.approveReturn);

module.exports = router;
