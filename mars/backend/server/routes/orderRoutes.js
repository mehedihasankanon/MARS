const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/my-orders", authenticateToken, orderController.getMyOrders);
router.get(
  "/seller-orders",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  orderController.getSellerOrders,
);
router.patch(
  "/:orderId/status",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  orderController.updateOrderStatus,
);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("customer", "seller"),
  orderController.placeOrder,
);

module.exports = router;
