const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  createExam,
  updateExam,
  getExam,
  getCourseExams,
  getMyExams,
  getExamResults,
  getExamCopies,
  getExamCopy,
  suggestExamCopyGrades,
  gradeExamCopy,
  exportExamResults,
  publishExam,
  deleteExam,
} = require("../controllers/xam.controller");

const router = express.Router();

router.use(authenticate);

// Créer
router.post("/", authorize("TEACHER"), createExam);
router.get("/", getMyExams);

// Liste des examens d'un cours
router.get(
  "/course/:courseId",
  getCourseExams
);

router.get("/:id/results", authorize("TEACHER"), getExamResults);
router.get("/:id/results/export/:format", authorize("TEACHER"), exportExamResults);
router.get("/:id/copies", authorize("TEACHER"), getExamCopies);
router.get("/:id/copies/:attemptId", authorize("TEACHER"), getExamCopy);
router.post("/:id/copies/:attemptId/ai-suggestions", authorize("TEACHER"), suggestExamCopyGrades);
router.patch("/:id/copies/:attemptId/grade", authorize("TEACHER"), gradeExamCopy);

// Consulter
router.get("/:id", getExam);

// Modifier
router.put("/:id", authorize("TEACHER"), updateExam);

// Publier
router.patch(
  "/:id/publish",
  authorize("TEACHER"),
  publishExam
);

// Supprimer
router.delete("/:id", authorize("TEACHER"), deleteExam);

module.exports = router;
