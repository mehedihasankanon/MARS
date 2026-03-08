const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const { authenticateToken, authorizeRoles } = require("../middleware/jwt");

router.get("/:productId", questionController.getProductQuestions);

router.post(
  "/:productId",
  authenticateToken,
  authorizeRoles("customer", "seller"),
  questionController.createQuestion
);

router.put(
  "/:productId/:questionId/answer",
  authenticateToken,
  authorizeRoles("seller", "admin"),
  questionController.answerQuestion
);

module.exports = router;
