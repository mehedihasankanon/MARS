const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { ensureApprovedSeller } = require("../middleware/sellerApproval");

// Public — anyone can browse active deals
router.get("/", offerController.getActiveOffers);

// Public — show offers on a product detail page
router.get("/product/:productId", offerController.getOffersByProduct);

// Seller or admin — create a new time-limited offer
router.post(
  "/",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  offerController.createOffer,
);

// Seller or admin — edit an existing offer
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  offerController.updateOffer,
);

// Seller or admin — remove an offer
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  ensureApprovedSeller,
  offerController.deleteOffer,
);

module.exports = router;
