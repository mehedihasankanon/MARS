const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");
const { upload } = require("../config/cloudinary");

router.get("/profile", authenticateToken, userController.getProfile);
router.post("/become-seller", authenticateToken, userController.becomeSeller);
router.post("/profile/picture", authenticateToken, upload.single("profilePicture"), userController.uploadProfilePicture);
router.delete("/profile/picture", authenticateToken, userController.removeProfilePicture);
router.get(
  "/seller-requests",
  authenticateToken,
  authorizeRoles("admin"),
  userController.getPendingSellers,
);
router.post(
  "/seller-requests/:sellerId/approve",
  authenticateToken,
  authorizeRoles("admin"),
  userController.approveSeller,
);
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.getAllUsers,
);
router.get("/:id", authenticateToken, userController.getUserById);

module.exports = router;
