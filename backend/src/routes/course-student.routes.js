const express = require("express");

const router = express.Router();

const authenticate =
  require("../middleware/auth.middleware");

const authorize =
  require("../middleware/role.middleware");

const controller =
  require("../controllers/course-student.controller");

// =====================================================
// LISTE DES ÉTUDIANTS
// =====================================================

router.get(
  "/:courseId/students",
  authenticate,
  controller.getStudents
);

// =====================================================
// AJOUTER UN ÉTUDIANT
// =====================================================

router.post(
  "/:courseId/students",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  controller.addStudent
);

// =====================================================
// RETIRER UN ÉTUDIANT
// =====================================================

router.delete(
  "/:courseId/students/:studentId",
  authenticate,
  authorize("TEACHER", "ADMIN"),
  controller.removeStudent
);

module.exports = router;