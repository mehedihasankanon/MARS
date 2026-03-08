const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlistController");
const { authenticateToken } = require("../middleware/jwt");

router.get("/", authenticateToken, wishlistController.getWishlist);

router.post(
  "/items/:itemid",
  authenticateToken,
  wishlistController.addItemToWishlist,
);

router.delete(
  "/items/:itemid",
  authenticateToken,
  wishlistController.removeItemFromWishlist,
);

module.exports = router;
