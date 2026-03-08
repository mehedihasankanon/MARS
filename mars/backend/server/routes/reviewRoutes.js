const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/:productId", reviewController.getProductReviews);

router.post(
  "/:productId",
  authenticateToken,
  authorizeRoles("customer", "seller"),
  reviewController.createReview
);

router.delete(
  "/:productId/:reviewId",
  authenticateToken,
  authorizeRoles("customer", "seller", "admin"),
  reviewController.deleteReview
);

module.exports = router;
