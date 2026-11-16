const enrollmentService = require(
  "../services/enrollment.service"
);


// =====================================================
// AJOUTER
// =====================================================

const addStudent = async (req, res, next) => {

  try {

    const { courseId } = req.params;
    const { studentId } = req.body;

    const enrollment =
      await enrollmentService.addStudentToCourse(
        courseId,
        studentId,
        req.user.id
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

    const { courseId, studentId } =
      req.params;

    await enrollmentService.removeStudentFromCourse(
      courseId,
      studentId,
      req.user.id
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

    const { courseId } = req.params;

    const students =
      await enrollmentService.getCourseStudents(
        courseId,
        req.user.id
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