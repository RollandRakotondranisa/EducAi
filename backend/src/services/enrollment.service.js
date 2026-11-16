const { CourseStudent, Course, User } = require("../models");


// =====================================================
// AJOUTER UN ETUDIANT
// =====================================================

const addStudentToCourse = async (
  courseId,
  studentId,
  teacherId
) => {

  // Vérifier le cours
  const course = await Course.findOne({
    where: {
      id: courseId,
      teacherId: teacherId,
    },
  });

  if (!course) {
    const error = new Error(
      "Cours introuvable ou non autorisé"
    );

    error.statusCode = 404;

    throw error;
  }


  // Vérifier l'étudiant
  const student = await User.findOne({
    where: {
      id: studentId,
      role: "STUDENT",
      isActive: true,
    },
  });

  if (!student) {
    const error = new Error(
      "Étudiant introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // Vérifier si déjà affecté
  const existing = await CourseStudent.findOne({
    where: {
      courseId,
      studentId,
    },
  });

  if (existing) {
    const error = new Error(
      "Cet étudiant est déjà affecté à ce cours"
    );

    error.statusCode = 409;

    throw error;
  }


  // Affectation
  const enrollment = await CourseStudent.create({
    courseId,
    studentId,
  });


  return enrollment;
};


// =====================================================
// RETIRER UN ETUDIANT
// =====================================================

const removeStudentFromCourse = async (
  courseId,
  studentId,
  teacherId
) => {

  // Vérifier que le professeur possède le cours
  const course = await Course.findOne({
    where: {
      id: courseId,
      teacherId: teacherId,
    },
  });

  if (!course) {
    const error = new Error(
      "Cours introuvable ou non autorisé"
    );

    error.statusCode = 404;

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
      "Cet étudiant n'est pas affecté à ce cours"
    );

    error.statusCode = 404;

    throw error;
  }


  await enrollment.destroy();

  return true;
};


// =====================================================
// LISTE DES ETUDIANTS
// =====================================================

const getCourseStudents = async (
  courseId,
  teacherId
) => {

  // Vérifier le cours
  const course = await Course.findOne({
    where: {
      id: courseId,
      teacherId: teacherId,
    },
  });

  if (!course) {
    const error = new Error(
      "Cours introuvable ou non autorisé"
    );

    error.statusCode = 404;

    throw error;
  }


  const enrollments =
    await CourseStudent.findAll({

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


  return enrollments;
};


module.exports = {
  addStudentToCourse,
  removeStudentFromCourse,
  getCourseStudents,
};