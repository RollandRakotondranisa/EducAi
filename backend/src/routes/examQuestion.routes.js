const express = require("express");

const authenticate = require(
  "../middleware/auth.middleware"
);
const authorize = require("../middleware/role.middleware");

const {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require(
  "../controllers/examQuestion.controller"
);

const router = express.Router();

router.use(authenticate);

// Ajouter une question
router.post(
  "/exam/:examId",
  authorize("TEACHER"),
  createQuestion
);

// Modifier
router.put(
  "/:id",
  authorize("TEACHER"),
  updateQuestion
);

// Supprimer
router.delete(
  "/:id",
  authorize("TEACHER"),
  deleteQuestion
);

module.exports = router;