const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");

const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { ensureApprovedSeller } = require("../middleware/sellerApproval");
const { returnUpload } = require("../config/cloudinary");

// Customers can request returns
router.post(
  "/request",
  authenticateToken,
  authorizeRoles("customer", "admin"),
  returnUpload.array("images", 5),
  returnController.requestReturn,
);

// Sellers fetch incoming return requests
router.get(
  "/seller",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  returnController.getSellerReturns,
);

// Sellers approve returns
router.post(
  "/approve/:returnId",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  returnController.approveReturn,
);

module.exports = router;
