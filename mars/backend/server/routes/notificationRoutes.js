const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/jwt");

router.get("/", authenticateToken, notificationController.getNotifications);
router.patch("/read-all", authenticateToken, notificationController.markAllAsRead);
router.patch("/:notificationId/read", authenticateToken, notificationController.markAsRead);

module.exports = router;
