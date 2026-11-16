const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const courseController = require("../controllers/course.controller");

// =====================================================
// COURS
// =====================================================

// Créer un cours
router.post(
  "/",
  authenticate,
  authorize("TEACHER"),
  courseController.createCourse
);

// Consulter tous les cours
router.get(
  "/",
  authenticate,
  courseController.getAllCourses
);

// Consulter un cours
router.get(
  "/:id",
  authenticate,
  courseController.getCourseById
);

// Modifier un cours
router.put(
  "/:id",
  authenticate,
  authorize("TEACHER"),
  courseController.updateCourse
);

// Supprimer un cours
router.delete(
  "/:id",
  authenticate,
  authorize("TEACHER"),
  courseController.deleteCourse
);

module.exports = router;