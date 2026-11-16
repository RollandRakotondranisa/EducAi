const {
  Exam,
  Course,
  ExamQuestion,
  CourseStudent,
  User,
  AcademicClass,
  AcademicYear,
  AcademicProgram,
  AcademicLevel,
} = require("../models");
const { Op } = require("sequelize");
const academicService = require("./academic.service");

const validateExamTiming = ({ duration, startDate, endDate }, now = new Date()) => {
  const parsedDuration = Number(duration);
  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;

  if (!Number.isInteger(parsedDuration) || parsedDuration < 10 || parsedDuration > 180) {
    const error = new Error("La durée doit être comprise entre 10 et 180 minutes");
    error.statusCode = 400;
    throw error;
  }
  if (!parsedStartDate || Number.isNaN(parsedStartDate.getTime())) {
    const error = new Error("La date de début est invalide");
    error.statusCode = 400;
    throw error;
  }
  if (parsedStartDate < now) {
    const error = new Error("La date de début ne peut pas être dans le passé");
    error.statusCode = 400;
    throw error;
  }
  if (!parsedEndDate || Number.isNaN(parsedEndDate.getTime()) || parsedEndDate <= parsedStartDate) {
    const error = new Error("La date de fin doit être postérieure à la date de début");
    error.statusCode = 400;
    throw error;
  }
  if (parsedEndDate - parsedStartDate < parsedDuration * 60 * 1000) {
    const error = new Error("La période de l'examen doit permettre à chaque étudiant de disposer de toute la durée prévue");
    error.statusCode = 400;
    throw error;
  }

  return { duration: parsedDuration, startDate: parsedStartDate, endDate: parsedEndDate };
};

const validateExpectedQuestionCount = (value) => {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    const error = new Error("Le nombre de questions doit être compris entre 1 et 50");
    error.statusCode = 400;
    throw error;
  }
  return count;
};

const attachEligibleStudentCounts = async (exams) => {
  if (!exams.length) return exams;

  const courseIds = [...new Set(exams.map((exam) => exam.courseId))];
  const [students, enrollments] = await Promise.all([
    User.findAll({
      where: { role: "STUDENT" },
      attributes: ["id", "program", "level", "academicClassId"],
    }),
    CourseStudent.findAll({
      where: { courseId: courseIds },
      attributes: ["courseId", "studentId"],
    }),
  ]);
  const enrolledByCourse = enrollments.reduce((courses, enrollment) => {
    if (!courses.has(enrollment.courseId)) courses.set(enrollment.courseId, new Set());
    courses.get(enrollment.courseId).add(enrollment.studentId);
    return courses;
  }, new Map());

  exams.forEach((exam) => {
    const enrolledStudentIds = enrolledByCourse.get(exam.courseId) || new Set();
    const eligibleStudentCount = students.filter((student) => {
      if (exam.targetAcademicClassId) {
        return student.academicClassId === exam.targetAcademicClassId
          && exam.course?.targetAcademicClassId === exam.targetAcademicClassId;
      }
      const matchesExamTarget = exam.targetAcademicClassId
        ? student.academicClassId === exam.targetAcademicClassId
        : student.program === exam.targetProgram && student.level === exam.targetLevel;
      const matchesCourseTarget = exam.course
        && (exam.course.targetAcademicClassId
          ? student.academicClassId === exam.course.targetAcademicClassId
          : student.program === exam.course.targetProgram && student.level === exam.course.targetLevel);
      return matchesExamTarget && (enrolledStudentIds.has(student.id) || matchesCourseTarget);
    }).length;
    exam.setDataValue("eligibleStudentCount", eligibleStudentCount);
  });

  return exams;
};

// =====================================================
// CREER UN EXAMEN
// =====================================================

const createExam = async ({
  title,
  description,
  targetAcademicClassId,
  courseId,
  expectedQuestionCount,
  duration,
  startDate,
  endDate,
  userId,
}) => {
  const course = await Course.findOne({
    where: {
      id: courseId,
      teacherId: userId,
    },
  });

  if (!course) {
    const error = new Error(
      "Cours introuvable ou vous n'êtes pas le professeur"
    );

    error.statusCode = 404;
    throw error;
  }

  const targetClass = await academicService.getAssignedActiveClass(targetAcademicClassId, userId);
  if (Number(course.targetAcademicClassId) !== targetClass.id) {
    const error = new Error("La classe ciblée par l'examen doit être celle du cours associé.");
    error.statusCode = 400;
    throw error;
  }

  const timing = validateExamTiming({ duration, startDate, endDate });
  const questionCount = validateExpectedQuestionCount(expectedQuestionCount);

  const exam = await Exam.create({
    title,
    description,
    targetProgram: targetClass.program.name,
    targetLevel: targetClass.level.name,
    targetAcademicClassId: targetClass.id,
    expectedQuestionCount: questionCount,
    courseId,
    teacherId: userId,
    duration: timing.duration,
    startDate: timing.startDate,
    endDate: timing.endDate,
    status: "DRAFT",
  });

  return exam.reload({ include: [{ model: AcademicClass, as: "targetClass", include: [
    { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
    { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
    { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
  ] }] });
};

// =====================================================
// MODIFIER UN EXAMEN
// =====================================================

const updateExam = async ({
  examId,
  userId,
  title,
  description,
  targetAcademicClassId,
  courseId,
  expectedQuestionCount,
  duration,
  startDate,
  endDate,
}) => {
  const exam = await Exam.findByPk(examId, {
    include: [
      {
        model: Course,
        as: "course",
      },
    ],
  });

  if (!exam) {
    const error = new Error("Examen introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (exam.course.teacherId !== userId) {
    const error = new Error(
      "Vous n'êtes pas autorisé à modifier cet examen"
    );

    error.statusCode = 403;
    throw error;
  }

  if (exam.status === "PUBLISHED") {
    const error = new Error(
      "Un examen publié ne peut plus être modifié"
    );

    error.statusCode = 400;
    throw error;
  }

  const targetCourse = await Course.findOne({
    where: { id: courseId ?? exam.courseId, teacherId: userId },
  });
  if (!targetCourse) {
    const error = new Error("Cours introuvable ou vous n'êtes pas le professeur");
    error.statusCode = 404;
    throw error;
  }
  const targetClass = await academicService.getAssignedActiveClass(
    targetAcademicClassId ?? exam.targetAcademicClassId,
    userId
  );
  if (Number(targetCourse.targetAcademicClassId) !== targetClass.id) {
    const error = new Error("La classe ciblée par l'examen doit être celle du cours associé.");
    error.statusCode = 400;
    throw error;
  }

  const timing = validateExamTiming({
    duration: duration ?? exam.duration,
    startDate: startDate ?? exam.startDate,
    endDate: endDate === undefined ? exam.endDate : endDate,
  });
  const questionCount = validateExpectedQuestionCount(
    expectedQuestionCount ?? exam.expectedQuestionCount ?? await ExamQuestion.count({ where: { examId: exam.id } })
  );
  const existingQuestionCount = await ExamQuestion.count({ where: { examId: exam.id } });
  if (questionCount < existingQuestionCount) {
    const error = new Error("Le nombre prévu ne peut pas être inférieur au nombre de questions déjà ajoutées");
    error.statusCode = 400;
    throw error;
  }

  await exam.update({
    title,
    description,
    courseId: targetCourse.id,
    targetProgram: targetClass.program.name,
    targetLevel: targetClass.level.name,
    targetAcademicClassId: targetClass.id,
    expectedQuestionCount: questionCount,
    duration: timing.duration,
    startDate: timing.startDate,
    endDate: timing.endDate,
  });

  return exam.reload({ include: [{ model: AcademicClass, as: "targetClass", include: [
    { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
    { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
    { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
  ] }] });
};

// =====================================================
// CONSULTER UN EXAMEN
// =====================================================

const getExamById = async (examId, user) => {
  const targetUser = user.role === "STUDENT" ? await User.findByPk(user.id, { attributes: ["id", "role", "program", "level", "academicClassId"] }) : user;
  const exam = await Exam.findByPk(examId, {
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
        model: Course,
        as: "course",
      },
      {
        model: ExamQuestion,
        as: "questions",
      },
    ],
  });

  if (!exam) {
    const error = new Error("Examen introuvable");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = user.role === "ADMIN";
  const isOwner = user.role === "TEACHER" && exam.course.teacherId === user.id;
  let isEnrolled = false;
  if (targetUser.role === "STUDENT") {
    const isEnrolledInCourse = Boolean(await CourseStudent.findOne({ where: { courseId: exam.courseId, studentId: targetUser.id } }));
    if (exam.targetAcademicClassId) {
      isEnrolled = exam.targetAcademicClassId === targetUser.academicClassId
        && exam.course.targetAcademicClassId === targetUser.academicClassId;
    } else {
      const isTargetedCourse = exam.course.targetProgram === targetUser.program && exam.course.targetLevel === targetUser.level;
      const isTargetedExam = exam.targetProgram === targetUser.program && exam.targetLevel === targetUser.level;
      isEnrolled = (isEnrolledInCourse || isTargetedCourse) && isTargetedExam;
    }
  }
  if (!isAdmin && !isOwner && !(isEnrolled && exam.status === "PUBLISHED")) {
    const error = new Error("Vous n'êtes pas autorisé à consulter cet examen");
    error.statusCode = 403;
    throw error;
  }

  if (targetUser.role === "STUDENT") {
    exam.questions = exam.questions.map((question) => {
      const safeQuestion = question.toJSON();
      delete safeQuestion.correctAnswer;
      return safeQuestion;
    });
  }

  return exam;
};

// =====================================================
// LISTE DES EXAMENS D'UN COURS
// =====================================================

const getCourseExams = async (courseId, user) => {
  const targetUser = user.role === "STUDENT" ? await User.findByPk(user.id, { attributes: ["id", "role", "program", "level", "academicClassId"] }) : user;
  const course = await Course.findByPk(courseId);
  if (!course) {
    const error = new Error("Cours introuvable");
    error.statusCode = 404;
    throw error;
  }
  const isAllowed = user.role === "ADMIN" || (user.role === "TEACHER" && course.teacherId === user.id);
  if (!isAllowed) {
    const enrolled = targetUser.role === "STUDENT" && await CourseStudent.findOne({ where: { courseId, studentId: targetUser.id } });
    const isTargetedCourse = course.targetAcademicClassId
      ? course.targetAcademicClassId === targetUser.academicClassId
      : course.targetProgram === targetUser.program && course.targetLevel === targetUser.level;
    if (!enrolled && !isTargetedCourse) {
      const error = new Error("Vous n'êtes pas autorisé à consulter les examens de ce cours");
      error.statusCode = 403;
      throw error;
    }
    if (course.targetAcademicClassId) {
      return Exam.findAll({
        where: { courseId, status: "PUBLISHED", targetAcademicClassId: targetUser.academicClassId },
        include: [{ model: AcademicClass, as: "targetClass", include: [
          { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
          { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
          { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
        ] }],
        order: [["createdAt", "DESC"]],
      });
    }
    if (!targetUser.program?.trim() || !targetUser.level?.trim()) return [];
    return Exam.findAll({ where: { courseId, status: "PUBLISHED", targetProgram: targetUser.program, targetLevel: targetUser.level }, order: [["createdAt", "DESC"]] });
  }
  return Exam.findAll({
    where: {
      courseId,
    },
    order: [["createdAt", "DESC"]],
  });
};

const getExamsForUser = async (user) => {
  const targetUser = user.role === "STUDENT" ? await User.findByPk(user.id, { attributes: ["id", "role", "program", "level", "academicClassId"] }) : user;
  const where = user.role === "TEACHER" ? { teacherId: user.id } : {};
  const course = {
    model: Course,
    as: "course",
    attributes: ["id", "name", "code", "teacherId", "targetProgram", "targetLevel", "targetAcademicClassId"],
  };

  if (targetUser.role === "STUDENT") {
    const [targetedCourses, enrollments] = await Promise.all([
      Course.findAll({
        where: targetUser.academicClassId ? {
          [Op.or]: [
            { targetAcademicClassId: targetUser.academicClassId },
            { targetAcademicClassId: null, targetProgram: targetUser.program, targetLevel: targetUser.level },
          ],
        } : {
          targetProgram: targetUser.program,
          targetLevel: targetUser.level,
        },
        attributes: ["id"],
      }),
      CourseStudent.findAll({
        where: { studentId: targetUser.id },
        attributes: ["courseId"],
      }),
    ]);
    const courseIds = [...new Set([
      ...targetedCourses.map((courseItem) => courseItem.id),
      ...enrollments.map((enrollment) => enrollment.courseId),
    ])];
    if (courseIds.length === 0) return [];
    const studentExamTargets = targetUser.academicClassId ? [
      { targetAcademicClassId: targetUser.academicClassId },
      { targetAcademicClassId: null, targetProgram: targetUser.program, targetLevel: targetUser.level },
    ] : [{ targetProgram: targetUser.program, targetLevel: targetUser.level }];
    where.status = "PUBLISHED";
    where[Op.or] = studentExamTargets;
    where.courseId = { [Op.in]: courseIds };
  }

  const exams = await Exam.findAll({ where, include: [course, {
    model: AcademicClass,
    as: "targetClass",
    include: [
      { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
      { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
      { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
    ],
  }], order: [["startDate", "ASC"]] });
  return targetUser.role === "TEACHER" ? attachEligibleStudentCounts(exams) : exams;
};

// =====================================================
// PUBLIER UN EXAMEN
// =====================================================

const publishExam = async ({
  examId,
  userId,
}) => {
  const exam = await Exam.findByPk(examId, {
    include: [
      {
        model: Course,
        as: "course",
      },
      {
        model: AcademicClass,
        as: "targetClass",
      },
      {
        model: ExamQuestion,
        as: "questions",
      },
    ],
  });

  if (!exam) {
    const error = new Error("Examen introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (exam.course.teacherId !== userId) {
    const error = new Error(
      "Vous n'êtes pas autorisé à publier cet examen"
    );

    error.statusCode = 403;
    throw error;
  }

  if (!exam.questions || exam.questions.length === 0) {
    const error = new Error(
      "Impossible de publier un examen sans questions"
    );

    error.statusCode = 400;
    throw error;
  }
  if (exam.expectedQuestionCount && exam.questions.length !== exam.expectedQuestionCount) {
    const error = new Error(`Ajoutez exactement ${exam.expectedQuestionCount} questions avant de publier cet examen (${exam.questions.length} actuellement).`);
    error.statusCode = 400;
    throw error;
  }

  if (exam.targetAcademicClassId) {
    if (exam.targetAcademicClassId !== exam.course.targetAcademicClassId) {
      const error = new Error("La classe ciblée par l'examen doit être celle du cours associé");
      error.statusCode = 400;
      throw error;
    }
  } else if (!exam.targetProgram?.trim() || !exam.targetLevel?.trim()) {
    const error = new Error("Renseignez une classe ciblée avant de publier l'examen");
    error.statusCode = 400;
    throw error;
  }

  if (new Date(exam.startDate) < new Date()) {
    const error = new Error("Impossible de publier un examen dont la date de début est passée");
    error.statusCode = 400;
    throw error;
  }

  await exam.update({
    status: "PUBLISHED",
    endDate: exam.endDate || new Date(new Date(exam.startDate).getTime() + Number(exam.duration) * 60 * 1000),
  });

  return exam;
};

// =====================================================
// SUPPRIMER UN EXAMEN
// =====================================================

const deleteExam = async ({
  examId,
  userId,
}) => {
  const exam = await Exam.findByPk(examId, {
    include: [
      {
        model: Course,
        as: "course",
      },
    ],
  });

  if (!exam) {
    const error = new Error("Examen introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (exam.course.teacherId !== userId) {
    const error = new Error(
      "Vous n'êtes pas autorisé à supprimer cet examen"
    );

    error.statusCode = 403;
    throw error;
  }

  await exam.destroy();

  return true;
};

module.exports = {
  createExam,
  updateExam,
  getExamById,
  getCourseExams,
  getExamsForUser,
  publishExam,
  deleteExam,
};
