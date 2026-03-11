
const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.post("/", authenticateToken, authorizeRoles("admin"), couponController.createCoupon);

router.get("/", authenticateToken, authorizeRoles("admin"), couponController.getAllCoupons);

router.delete("/:id", authenticateToken, authorizeRoles("admin"), couponController.deleteCoupon);

router.post("/validate", authenticateToken, couponController.validateCoupon);

// router.put("/:id", authenticateToken, authorizeRoles("admin"), couponController.updateCoupon);

router.put("/disable/:id", authenticateToken, authorizeRoles("admin"), couponController.disableCoupon);


module.exports = router;