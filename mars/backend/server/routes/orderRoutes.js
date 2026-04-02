const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { ensureApprovedSeller } = require("../middleware/sellerApproval");

router.get("/my-orders", authenticateToken, orderController.getMyOrders);
router.get(
  "/seller-orders",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  orderController.getSellerOrders,
);
router.patch(
  "/:orderId/status",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  orderController.updateOrderStatus,
);
router.patch(
  "/:orderId/items/:productId/status",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  orderController.updateOrderItemStatus,
);
router.post(
  "/:orderId/items/:productId/delivery-confirmation",
  authenticateToken,
  authorizeRoles("customer", "admin"),
  orderController.confirmDelivery,
);
router.get(
  "/seller/delivery-issues",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  orderController.getSellerDeliveryIssues,
);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("customer", "seller"),
  orderController.placeOrder,
);

module.exports = router;
