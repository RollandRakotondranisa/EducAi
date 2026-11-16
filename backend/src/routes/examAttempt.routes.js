const express = require("express");

const authenticate = require(
  "../middleware/auth.middleware"
);
const authorize = require("../middleware/role.middleware");

const {
  startAttempt,
  getAttempt,
  submitAttempt,
  getMyAttempts,
  getMyResults,
  getResult,
} = require(
  "../controllers/examAttempt.controller"
);

const router = express.Router();

router.use(authenticate);

// Mes tentatives
router.get(
  "/my-attempts",
  authorize("STUDENT"),
  getMyAttempts
);

router.get("/my-results", authorize("STUDENT"), getMyResults);
router.get("/results/:id", authorize("STUDENT"), getResult);

// Démarrer un examen
router.post(
  "/exam/:examId/start",
  authorize("STUDENT"),
  startAttempt
);

// Consulter une tentative
router.get(
  "/:id",
  authorize("STUDENT"),
  getAttempt
);

// Soumettre
router.patch(
  "/:id/submit",
  authorize("STUDENT"),
  submitAttempt
);

module.exports = router;