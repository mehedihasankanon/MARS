const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/my-orders", authenticateToken, orderController.getMyOrders);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("customer"),
  orderController.placeOrder,
);

module.exports = router;
