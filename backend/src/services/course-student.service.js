const CourseStudent = require("../models/CourseStudent");
const Course = require("../models/Course");
const User = require("../models/User");

// =====================================================
// AJOUTER UN ÉTUDIANT À UN COURS
// =====================================================

const addStudentToCourse = async (
  courseId,
  studentId,
  user
) => {

  // Vérifier le cours
  const course = await Course.findByPk(courseId);

  if (!course) {
    const error = new Error("Cours introuvable");
    error.statusCode = 404;
    throw error;
  }

  // Un enseignant ne peut gérer
  // que ses propres cours
  if (
    user.role === "TEACHER" &&
    course.teacherId !== user.id
  ) {
    const error = new Error(
      "Vous n'êtes pas autorisé à gérer ce cours"
    );

    error.statusCode = 403;
    throw error;
  }

  // Vérifier l'étudiant
  const student = await User.findOne({
    where: {
      id: studentId,
      role: "STUDENT",
    },
  });

  if (!student) {
    const error = new Error(
      "Étudiant introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  // Vérifier si déjà inscrit
  const existing = await CourseStudent.findOne({
    where: {
      courseId,
      studentId,
    },
  });

  if (existing) {
    const error = new Error(
      "Cet étudiant est déjà inscrit à ce cours"
    );

    error.statusCode = 409;
    throw error;
  }

  const enrollment = await CourseStudent.create({
    courseId,
    studentId,
  });

  return enrollment;
};


// =====================================================
// RETIRER UN ÉTUDIANT
// =====================================================

const removeStudentFromCourse = async (
  courseId,
  studentId,
  user
) => {

  const course = await Course.findByPk(courseId);

  if (!course) {
    const error = new Error("Cours introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role === "TEACHER" &&
    course.teacherId !== user.id
  ) {
    const error = new Error(
      "Vous n'êtes pas autorisé à gérer ce cours"
    );

    error.statusCode = 403;
    throw error;
  }

  const enrollment = await CourseStudent.findOne({
    where: {
      courseId,
      studentId,
    },
  });

  if (!enrollment) {
    const error = new Error(
      "Cet étudiant n'est pas inscrit à ce cours"
    );

    error.statusCode = 404;
    throw error;
  }

  await enrollment.destroy();

  return true;
};


// =====================================================
// LISTE DES ÉTUDIANTS D'UN COURS
// =====================================================

const getCourseStudents = async (
  courseId,
  user
) => {

  if (user.role === "STUDENT") {
    const error = new Error("La liste des étudiants est réservée à l'enseignant du cours et à l'administrateur");
    error.statusCode = 403;
    throw error;
  }

  const course = await Course.findByPk(courseId);

  if (!course) {
    const error = new Error("Cours introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role === "TEACHER" &&
    course.teacherId !== user.id
  ) {
    const error = new Error(
      "Vous n'êtes pas autorisé à consulter cette liste"
    );

    error.statusCode = 403;
    throw error;
  }

  const students = await CourseStudent.findAll({
    where: {
      courseId,
    },

    include: [
      {
        model: User,
        as: "student",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "isActive",
          "avatar",
          "matricule",
          "level",
          "program",
          "phone",
        ],
      },
    ],

    order: [
      ["createdAt", "DESC"],
    ],
  });

  return students;
};


module.exports = {
  addStudentToCourse,
  removeStudentFromCourse,
  getCourseStudents,
};