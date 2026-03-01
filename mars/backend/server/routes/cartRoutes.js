const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeRoles } = require('../middleware/jwt');

router.get('/', authenticateToken, authorizeRoles("customer"), cartController.getCartItems);

router.post("/items", authenticateToken, authorizeRoles("customer"), cartController.addItemToCart);

router.delete("/items/:itemId", authenticateToken, authorizeRoles("customer"), cartController.removeItemFromCart);

router.put("/items/:productId", authenticateToken, authorizeRoles("customer"), cartController.updateCartItem);

module.exports = router;
