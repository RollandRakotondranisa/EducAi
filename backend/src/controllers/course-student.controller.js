const courseStudentService =
  require("../services/course-student.service");

// =====================================================
// AJOUTER
// =====================================================

const addStudent = async (req, res, next) => {
  try {

    const enrollment =
      await courseStudentService.addStudentToCourse(
        req.params.courseId,
        req.body.studentId,
        req.user
      );

    return res.status(201).json({
      success: true,
      message: "Étudiant ajouté au cours avec succès",
      data: enrollment,
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// RETIRER
// =====================================================

const removeStudent = async (req, res, next) => {
  try {

    await courseStudentService.removeStudentFromCourse(
      req.params.courseId,
      req.params.studentId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Étudiant retiré du cours avec succès",
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// LISTE
// =====================================================

const getStudents = async (req, res, next) => {
  try {

    const students =
      await courseStudentService.getCourseStudents(
        req.params.courseId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Liste des étudiants récupérée",
      data: students,
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  addStudent,
  removeStudent,
  getStudents,
};