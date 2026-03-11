const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

// Any authenticated user (access is checked inside the controller)
router.get(
  "/order/:orderId",
  authenticateToken,
  paymentController.getPaymentByOrder,
);

// Admin only — update payment status (Pending → Completed → Refunded)
router.patch(
  "/:paymentId/status",
  authenticateToken,
  authorizeRoles("admin"),
  paymentController.updatePaymentStatus,
);

module.exports = router;
