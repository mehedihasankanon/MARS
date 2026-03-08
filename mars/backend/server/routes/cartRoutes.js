const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeRoles } = require('../middleware/jwt');

router.get('/', authenticateToken, authorizeRoles("customer", "seller"), cartController.getCartItems);

router.post("/items", authenticateToken, authorizeRoles("customer", "seller"), cartController.addItemToCart);

router.delete("/items/:itemId", authenticateToken, authorizeRoles("customer", "seller"), cartController.removeItemFromCart);

router.put("/items/:product_id", authenticateToken, authorizeRoles("customer", "seller"), cartController.updateCartItem);

module.exports = router;
