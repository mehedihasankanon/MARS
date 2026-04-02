const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

// Customer scam report
router.post(
  "/scam",
  authenticateToken,
  authorizeRoles("customer", "admin"),
  reportController.reportScam,
);

// Admin-only view
router.get(
  "/scam",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.getScamReports,
);

router.patch(
  "/scam/:reportId/status",
  authenticateToken,
  authorizeRoles("admin"),
  reportController.updateScamReportStatus,
);

module.exports = router;

