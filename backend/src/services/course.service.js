const Course = require("../models/Course");
const User = require("../models/User");
const CourseStudent = require("../models/CourseStudent");
const Document = require("../models/Document");
const AcademicClass = require("../models/AcademicClass");
const AcademicYear = require("../models/AcademicYear");
const AcademicProgram = require("../models/AcademicProgram");
const AcademicLevel = require("../models/AcademicLevel");
const academicService = require("./academic.service");

// =====================================================
// CREER UN COURS
// =====================================================

const createCourse = async ({
  name,
  code,
  description,
  targetAcademicClassId,
  teacherId,
}) => {

  // Vérifier que l'enseignant existe
  const teacher = await User.findOne({
    where: {
      id: teacherId,
      role: "TEACHER",
    },
  });

  if (!teacher) {
    const error = new Error(
      "Enseignant introuvable"
    );

    error.statusCode = 404;

    throw error;
  }

  const targetClass = await academicService.getAssignedActiveClass(targetAcademicClassId, teacherId);

  // Vérifier si le code existe déjà
  const existingCourse = await Course.findOne({
    where: {
      code,
    },
  });

  if (existingCourse) {
    const error = new Error(
      "Ce code de cours existe déjà"
    );

    error.statusCode = 409;

    throw error;
  }

  // Créer le cours
  const course = await Course.create({
    name,
    code,
    description: description || null,
    targetProgram: targetClass.program.name,
    targetLevel: targetClass.level.name,
    targetAcademicClassId: targetClass.id,
    teacherId,
  });

  const targetedStudents = await User.findAll({
    where: {
      role: "STUDENT",
      academicClassId: targetClass.id,
    },
    attributes: ["id"],
  });

  if (targetedStudents.length) {
    await CourseStudent.bulkCreate(
      targetedStudents.map((student) => ({
        courseId: course.id,
        studentId: student.id,
      }))
    );
  }

  course.setDataValue("enrolledStudentCount", targetedStudents.length);

  return course.reload({
    include: [{
      model: AcademicClass,
      as: "targetClass",
      include: [
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
        { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
      ],
    }],
  });
};


// =====================================================
// CONSULTER TOUS LES COURS
// =====================================================

const getAllCourses = async (user) => {

  const where = {};
  const studentFilter = user.role === "STUDENT" ? { id: user.id } : undefined;
  const student = user.role === "STUDENT"
    ? await User.findByPk(user.id, { attributes: ["id", "program", "level", "academicClassId"] })
    : null;

  if (user.role === "TEACHER") {
    where.teacherId = user.id;
  }

  const courses = await Course.findAll({
    where,
    include: [
      {
        model: AcademicClass,
        as: "targetClass",
        include: [
          { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
          { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
          { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
        ],
      },
      {
        model: User,
        as: "teacher",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
        ],
      },
      {
        model: User,
        as: "students",
        attributes: ["id"],
        through: { attributes: [] },
        required: false,
        where: studentFilter,
      },
      {
        model: Document,
        as: "documents",
        attributes: [
          "id",
          "courseId",
          "originalName",
          "fileName",
          "mimeType",
          "extension",
          "fileSize",
          "status",
          "createdAt",
          "updatedAt",
        ],
        required: false,
      },
    ],

    order: [
      ["createdAt", "DESC"],
    ],
  });

  const courseIds = courses.map((course) => course.id);
  const enrollments = courseIds.length
    ? await CourseStudent.findAll({
      where: { courseId: courseIds },
      attributes: ["courseId"],
    })
    : [];
  const enrolledCounts = enrollments.reduce((counts, enrollment) => {
    counts.set(enrollment.courseId, (counts.get(enrollment.courseId) || 0) + 1);
    return counts;
  }, new Map());

  courses.forEach((course) => {
    course.setDataValue("enrolledStudentCount", enrolledCounts.get(course.id) || 0);
  });

  if (user.role !== "STUDENT") return courses;

  return courses.filter((course) => {
    const isTargeted = student
      && (course.targetAcademicClassId
        ? course.targetAcademicClassId === student.academicClassId
        : course.targetProgram === student.program && course.targetLevel === student.level);
    const isEnrolled = course.students.some((student) => student.id === user.id);
    return isTargeted || (!course.targetAcademicClassId && isEnrolled);
  });
};


// =====================================================
// CONSULTER UN COURS
// =====================================================

const getCourseById = async (courseId, user) => {

  const student = user.role === "STUDENT"
    ? await User.findByPk(user.id, { attributes: ["id", "program", "level", "academicClassId"] })
    : null;

  const course = await Course.findByPk(
    courseId,
    {
      include: [
        {
          model: AcademicClass,
          as: "targetClass",
          include: [
            { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
            { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
            { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
          ],
        },
        {
          model: User,
          as: "teacher",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
          ],
        },
        {
          model: User,
          as: "students",
          attributes: ["id"],
          through: { attributes: [] },
        },
        {
          model: Document,
          as: "documents",
          attributes: [
            "id",
            "courseId",
            "originalName",
            "fileName",
            "mimeType",
            "extension",
            "fileSize",
            "status",
            "createdAt",
            "updatedAt",
          ],
          required: false,
        },
      ],
    }
  );

  if (!course) {
    const error = new Error(
      "Cours introuvable"
    );

    error.statusCode = 404;

    throw error;
  }

  const isTeacher = user.role === "TEACHER" && course.teacherId === user.id;
  const isStudent = user.role === "STUDENT" && (
    (course.targetAcademicClassId
      ? student && course.targetAcademicClassId === student.academicClassId
      : course.students.some((enrolledStudent) => enrolledStudent.id === user.id)
        || (student && course.targetProgram === student.program && course.targetLevel === student.level))
  );

  if (user.role !== "ADMIN" && !isTeacher && !isStudent) {
    const error = new Error("Vous n'êtes pas autorisé à consulter ce cours");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "STUDENT") {
    course.students = course.students.filter((student) => student.id === user.id);
  }

  return course;
};


// =====================================================
// MODIFIER UN COURS
// =====================================================

const updateCourse = async (
  courseId,
  teacherId,
  data
) => {

  const course = await Course.findByPk(courseId);

  if (!course) {
    const error = new Error(
      "Cours introuvable"
    );

    error.statusCode = 404;

    throw error;
  }

  // Vérifier que le professeur est propriétaire
  if (course.teacherId !== teacherId) {
    const error = new Error(
      "Vous n'êtes pas autorisé à modifier ce cours"
    );

    error.statusCode = 403;

    throw error;
  }

  const targetClass = await academicService.getAssignedActiveClass(
    data.targetAcademicClassId ?? course.targetAcademicClassId,
    teacherId
  );

  // Vérifier le nouveau code
  if (data.code && data.code !== course.code) {

    const existingCourse = await Course.findOne({
      where: {
        code: data.code,
      },
    });

    if (existingCourse) {
      const error = new Error(
        "Ce code de cours existe déjà"
      );

      error.statusCode = 409;

      throw error;
    }
  }

  await course.update({
    name: data.name ?? course.name,
    code: data.code ?? course.code,
    description:
      data.description ?? course.description,
    targetProgram: targetClass.program.name,
    targetLevel: targetClass.level.name,
    targetAcademicClassId: targetClass.id,
  });

  const targetedStudents = await User.findAll({
    where: {
      role: "STUDENT",
      academicClassId: targetClass.id,
    },
    attributes: ["id"],
  });

  await course.setStudents(targetedStudents);

  return course.reload({
    include: [{
      model: AcademicClass,
      as: "targetClass",
      include: [
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
        { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
      ],
    }],
  });
};


// =====================================================
// SUPPRIMER UN COURS
// =====================================================

const deleteCourse = async (
  courseId,
  teacherId
) => {

  const course = await Course.findByPk(courseId);

  if (!course) {
    const error = new Error(
      "Cours introuvable"
    );

    error.statusCode = 404;

    throw error;
  }

  // Vérifier le propriétaire
  if (course.teacherId !== teacherId) {
    const error = new Error(
      "Vous n'êtes pas autorisé à supprimer ce cours"
    );

    error.statusCode = 403;

    throw error;
  }

  await course.destroy();

  return true;
};


module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
