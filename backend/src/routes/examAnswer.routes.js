const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  saveAnswer,
  getAttemptAnswers,
  deleteAnswer,
} = require("../controllers/examAnswer.controller");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Sauvegarder / modifier une réponse
router.post("/", authorize("STUDENT"), saveAnswer);

// Récupérer les réponses d'une tentative
router.get(
  "/attempt/:attemptId",
  authorize("STUDENT"),
  getAttemptAnswers
);

// Supprimer une réponse
router.delete(
  "/:answerId",
  authorize("STUDENT"),
  deleteAnswer
);

module.exports = router;