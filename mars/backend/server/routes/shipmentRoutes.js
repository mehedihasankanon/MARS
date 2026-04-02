const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { ensureApprovedSeller } = require("../middleware/sellerApproval");

// Any authenticated user (access is checked inside the controller)
router.get(
  "/order/:orderId",
  authenticateToken,
  shipmentController.getShipmentByOrder,
);

// Seller or admin — add tracking number, shipment date, etc.
router.patch(
  "/:shipmentId",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  shipmentController.updateShipment,
);

module.exports = router;
