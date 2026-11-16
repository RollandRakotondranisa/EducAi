const courseService = require("../services/course.service");

// =====================================================
// CREER
// =====================================================

const createCourse = async (req, res, next) => {
  try {

    const name = req.body.name?.trim();
    const code = req.body.code?.trim();
    const targetAcademicClassId = Number(req.body.targetAcademicClassId);

    if (!name || !code || !Number.isInteger(targetAcademicClassId) || targetAcademicClassId < 1) {
      return res.status(400).json({
        success: false,
        message: "Le nom, le code et la classe ciblée sont obligatoires",
      });
    }

    const course = await courseService.createCourse({
      name,
      code,
      description: req.body.description,
      targetAcademicClassId,
      teacherId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Cours créé avec succès",
      data: course,
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET ALL
// =====================================================

const getAllCourses = async (req, res, next) => {
  try {

    const courses =
      await courseService.getAllCourses(req.user);

    return res.status(200).json({
      success: true,
      message: "Cours récupérés avec succès",
      data: courses,
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// GET ONE
// =====================================================

const getCourseById = async (req, res, next) => {
  try {

    const course =
      await courseService.getCourseById(
        req.params.id,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Cours récupéré avec succès",
      data: course,
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// UPDATE
// =====================================================

const updateCourse = async (req, res, next) => {
  try {

    const course =
      await courseService.updateCourse(
        req.params.id,
        req.user.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Cours modifié avec succès",
      data: course,
    });

  } catch (error) {
    next(error);
  }
};


// =====================================================
// DELETE
// =====================================================

const deleteCourse = async (req, res, next) => {
  try {

    await courseService.deleteCourse(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Cours supprimé avec succès",
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
