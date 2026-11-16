const express = require("express");

const authenticate = require(
  "../middleware/auth.middleware"
);

const enrollmentController = require(
  "../controllers/enrollment.controller"
);

const router = express.Router();


// Toutes les routes nécessitent une authentification
router.use(authenticate);


// Ajouter un étudiant
router.post(
  "/courses/:courseId/students",
  enrollmentController.addStudent
);


// Liste des étudiants
router.get(
  "/courses/:courseId/students",
  enrollmentController.getStudents
);


// Retirer un étudiant
router.delete(
  "/courses/:courseId/students/:studentId",
  enrollmentController.removeStudent
);


module.exports = router;