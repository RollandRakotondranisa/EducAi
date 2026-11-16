const {
  Exam,
  Course,
  ExamAttempt,
  ExamQuestion,
  ExamAnswer,
  ExamResult,
  CourseStudent,
  User,
  Audit,
} = require("../models");
const sequelize = require("../config/database");
const examGradingAiService = require("./examGradingAi.service");

// =====================================================
// DEMARRER UN EXAMEN
// =====================================================

const startAttempt = async ({
  examId,
  studentId,
}) => {
  const exam = await Exam.findByPk(examId, {
    include: [
      {
        model: ExamQuestion,
        as: "questions",
      },
    ],
  });

  if (!exam) {
    const error = new Error(
      "Examen introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (exam.status !== "PUBLISHED") {
    const error = new Error(
      "Cet examen n'est pas disponible"
    );

    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (now < new Date(exam.startDate)) {
    const error = new Error("Cet examen n'est pas encore disponible");
    error.statusCode = 400;
    throw error;
  }
  if (exam.endDate && now >= new Date(exam.endDate)) {
    const error = new Error("La période de cet examen est terminée");
    error.statusCode = 400;
    throw error;
  }

  const enrollment = await CourseStudent.findOne({ where: { courseId: exam.courseId, studentId } });
  const student = await require("../models/User").findByPk(studentId, { attributes: ["program", "level", "academicClassId"] });
  const course = await require("../models/Course").findByPk(exam.courseId, { attributes: ["targetProgram", "targetLevel", "targetAcademicClassId"] });
  if (exam.targetAcademicClassId) {
    if (exam.targetAcademicClassId !== student?.academicClassId
      || exam.targetAcademicClassId !== course?.targetAcademicClassId) {
      const error = new Error("Cet examen n'est pas destiné à votre classe.");
      error.statusCode = 403;
      throw error;
    }
  } else {
    const isTargetedCourse = course
      && course.targetProgram === student?.program
      && course.targetLevel === student?.level;
    const isTargetedExam = exam.targetProgram === student?.program
      && exam.targetLevel === student?.level;
    if ((!enrollment && !isTargetedCourse) || !isTargetedExam) {
      const error = new Error("Vous n'êtes pas inscrit à ce cours");
      error.statusCode = 403;
      throw error;
    }
  }

  // Vérifier si l'étudiant a déjà une tentative
  const existingAttempt =
    await ExamAttempt.findOne({
      where: {
        examId,
        studentId,
      },
    });
  if (existingAttempt) {
    return existingAttempt;
  }

  const startedAt = new Date();

  const durationExpiry = new Date(startedAt.getTime() + exam.duration * 60 * 1000);
  const expiresAt = exam.endDate && new Date(exam.endDate) < durationExpiry
    ? new Date(exam.endDate)
    : durationExpiry;
  const attempt = await ExamAttempt.create({
    examId,
    studentId,
    startedAt,
    expiresAt,
    status: "IN_PROGRESS",
  });

  return attempt;
};

// =====================================================
// CONSULTER UNE TENTATIVE
// =====================================================

const getAttempt = async ({
  attemptId,
  studentId,
}) => {
  const attempt =
    await ExamAttempt.findOne({
      where: {
        id: attemptId,
        studentId,
      },
      include: [
        {
          model: Exam,
          as: "exam",
          include: [
            {
              model: ExamQuestion,
              as: "questions",
            },
          ],
        },
        {
          model: ExamAnswer,
          as: "answers",
        },
      ],
    });

  if (!attempt) {
    const error = new Error(
      "Tentative introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (attempt.exam?.questions) {
    attempt.exam.questions = attempt.exam.questions.map((question) => {
      const safeQuestion = question.toJSON();
      delete safeQuestion.correctAnswer;
      return safeQuestion;
    });
  }

  return attempt;
};

// =====================================================
// SOUMETTRE
// =====================================================

const submitAttempt = async ({
  attemptId,
  studentId,
}) => {
  const attempt =
    await ExamAttempt.findOne({
      where: {
        id: attemptId,
        studentId,
      },
    });

  if (!attempt) {
    const error = new Error(
      "Tentative introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (attempt.status !== "IN_PROGRESS") {
    const error = new Error(
      "Cette tentative est déjà soumise"
    );

    error.statusCode = 400;
    throw error;
  }

  await attempt.update({ status: "SUBMITTED", submittedAt: new Date() });
  return attempt;
};

const markAbsentStudents = async ({ examId, now = new Date() }) => {
  const exam = await Exam.findOne({
    where: { id: examId, status: "PUBLISHED" },
    include: [{ model: Course, as: "course" }, { model: ExamQuestion, as: "questions" }],
  });
  if (!exam) return { markedAbsent: 0 };

  const endDate = exam.endDate || new Date(new Date(exam.startDate).getTime() + Number(exam.duration) * 60 * 1000);
  if (new Date(endDate) > now) return { markedAbsent: 0 };

  const [students, enrollments] = await Promise.all([
    User.findAll({ where: { role: "STUDENT" }, attributes: ["id", "program", "level", "academicClassId"] }),
    CourseStudent.findAll({ where: { courseId: exam.courseId }, attributes: ["studentId"] }),
  ]);
  const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
  const eligibleStudents = students.filter((student) => {
    if (exam.targetAcademicClassId) {
      return student.academicClassId === exam.targetAcademicClassId
        && exam.course?.targetAcademicClassId === exam.targetAcademicClassId;
    }
    const matchesTarget = student.program === exam.targetProgram && student.level === exam.targetLevel;
    const matchesCourseTarget = exam.course?.targetProgram === student.program && exam.course?.targetLevel === student.level;
    return matchesTarget && (enrolledIds.has(student.id) || matchesCourseTarget);
  });
  let markedAbsent = 0;
  const totalPoints = exam.questions.reduce((sum, question) => sum + Number(question.points || 0), 0);

  for (const student of eligibleStudents) {
    const [attempt, result] = await Promise.all([
      ExamAttempt.findOne({ where: { examId, studentId: student.id } }),
      ExamResult.findOne({ where: { examId, studentId: student.id } }),
    ]);
    if (attempt || result) continue;

    const absentAttempt = await ExamAttempt.create({ examId, studentId: student.id, startedAt: null, expiresAt: endDate, status: "ABSENT" });
    await ExamResult.create({ studentId: student.id, examId, attemptId: absentAttempt.id, status: "ABSENT", score: 0, totalPoints, totalQuestions: exam.questions.length, correctAnswers: 0, wrongAnswers: 0, unansweredQuestions: exam.questions.length, percentage: 0, submittedAt: null });
    const existingNotification = await Audit.findOne({ where: { userId: exam.teacherId, targetUserId: student.id, action: "EXAM_ABSENCE" } });
    const notificationMetadata = existingNotification?.metadata;
    const alreadyNotified = notificationMetadata && notificationMetadata.examId === exam.id;
    if (!alreadyNotified) {
      await Audit.create({ userId: exam.teacherId, targetUserId: student.id, action: "EXAM_ABSENCE", description: `Absence à l'examen « ${exam.title} » : note 0/${totalPoints}`, metadata: { examId: exam.id, studentId: student.id, status: "ABSENT" } });
    }
    markedAbsent += 1;
  }
  return { markedAbsent };
};

// =====================================================
// MES TENTATIVES
// =====================================================

const getMyAttempts = async ({
  studentId,
}) => {
  return await ExamAttempt.findAll({
    where: {
      studentId,
    },
    include: [
      {
        model: Exam,
        as: "exam",
        include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getMyResults = ({ studentId }) => ExamResult.findAll({
  where: { studentId },
  include: [
    { model: Exam, as: "exam", include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }] },
    {
      model: ExamAttempt,
      as: "attempt",
      include: [{
        model: ExamAnswer,
        as: "answers",
        include: [{
          model: ExamQuestion,
          as: "question",
          attributes: ["id", "question", "points", "type"],
        }],
      }],
    },
  ],
  order: [["submittedAt", "DESC"]],
});

const getResult = async ({ resultId, studentId }) => {
  const result = await ExamResult.findOne({ where: { id: resultId, studentId }, include: [{ model: Exam, as: "exam" }] });
  if (!result) { const error = new Error("Résultat introuvable"); error.statusCode = 404; throw error; }
  return result;
};

const getExamResults = async ({ examId, teacherId }) => {
  const exam = await Exam.findOne({
    where: { id: examId, teacherId },
    include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
  });
  if (!exam) { const error = new Error("Examen introuvable ou non autorisé"); error.statusCode = 404; throw error; }
  const results = await ExamResult.findAll({
    where: { examId },
    include: [
      { model: require("../models/User"), as: "student", attributes: ["id", "firstName", "lastName", "email", "matricule"] },
    ],
    order: [["submittedAt", "DESC"]],
  });
  results.sort((left, right) => (
    String(left.student?.lastName || "").localeCompare(String(right.student?.lastName || ""), "fr")
    || String(left.student?.firstName || "").localeCompare(String(right.student?.firstName || ""), "fr")
  ));
  return { exam, results };
};

const getExamCopies = async ({ examId, teacherId }) => {
  const exam = await Exam.findOne({
    where: { id: examId, teacherId },
    include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
  });
  if (!exam) {
    const error = new Error("Examen introuvable ou non autorisé");
    error.statusCode = 404;
    throw error;
  }

  const attempts = await ExamAttempt.findAll({
    where: { examId, status: ["SUBMITTED", "GRADED"] },
    include: [
      { model: User, as: "student", attributes: ["id", "firstName", "lastName", "email", "matricule"] },
      { model: ExamAnswer, as: "answers", attributes: ["id", "questionId", "isCorrected"] },
    ],
    order: [["submittedAt", "DESC"]],
  });
  return { exam, attempts };
};

const getCopyForCorrection = async ({ examId, attemptId, teacherId }) => {
  const exam = await Exam.findOne({
    where: { id: examId, teacherId },
    include: [{ model: ExamQuestion, as: "questions", order: [["position", "ASC"], ["id", "ASC"]] }],
  });
  if (!exam) {
    const error = new Error("Examen introuvable ou non autorisé");
    error.statusCode = 404;
    throw error;
  }

  const attempt = await ExamAttempt.findOne({
    where: { id: attemptId, examId, status: ["SUBMITTED", "GRADED"] },
    include: [
      { model: User, as: "student", attributes: ["id", "firstName", "lastName", "email", "matricule"] },
      { model: ExamAnswer, as: "answers", include: [{ model: ExamQuestion, as: "question" }] },
    ],
  });
  if (!attempt) {
    const error = new Error("Copie introuvable ou non soumise");
    error.statusCode = 404;
    throw error;
  }
  return { exam, attempt };
};

const suggestExamCopyGrades = async ({ examId, attemptId, teacherId }) => {
  const { exam, attempt } = await getCopyForCorrection({ examId, attemptId, teacherId });
  const answerByQuestionId = new Map(
    attempt.answers.map((answer) => [String(answer.questionId), answer]),
  );
  const questions = exam.questions.map((question) => {
    const answer = answerByQuestionId.get(String(question.id));
    return {
      question_id: question.id,
      question: question.question,
      type: question.type,
      points: Number(question.points),
      options: Array.isArray(question.options) ? question.options : [],
      expected_answer: question.correctAnswer || null,
      student_answer: answer?.selectedOption ?? answer?.answerText ?? null,
    };
  });
  const response = await examGradingAiService.requestExamGradingSuggestions(questions);
  if (!Array.isArray(response.grades) || response.grades.length !== exam.questions.length) {
    const error = new Error("Le service IA n'a pas retourné une suggestion pour chaque question.");
    error.statusCode = 502;
    throw error;
  }

  const questionById = new Map(exam.questions.map((question) => [String(question.id), question]));
  const seenQuestionIds = new Set();
  const suggestions = response.grades.map((grade) => {
    const question = questionById.get(String(grade.question_id));
    if (!question || seenQuestionIds.has(String(grade.question_id))
      || typeof grade.points_obtained !== "number"
      || !Number.isFinite(grade.points_obtained)
      || grade.points_obtained < 0
      || grade.points_obtained > Number(question.points)
      || typeof grade.feedback !== "string"
      || typeof grade.rationale !== "string") {
      const error = new Error("Le service IA a retourné une suggestion de correction invalide.");
      error.statusCode = 502;
      throw error;
    }
    seenQuestionIds.add(String(grade.question_id));
    return {
      questionId: question.id,
      pointsObtained: grade.points_obtained,
      feedback: grade.feedback,
      rationale: grade.rationale,
    };
  });
  return { suggestions };
};

const gradeExamCopy = async ({ examId, attemptId, teacherId, grades }) => {
  const exam = await Exam.findOne({
    where: { id: examId, teacherId },
    include: [{ model: ExamQuestion, as: "questions", order: [["position", "ASC"], ["id", "ASC"]] }],
  });
  if (!exam) {
    const error = new Error("Examen introuvable ou non autorisé");
    error.statusCode = 404;
    throw error;
  }

  const attempt = await ExamAttempt.findOne({
    where: { id: attemptId, examId, status: ["SUBMITTED", "GRADED"] },
    include: [{ model: ExamAnswer, as: "answers" }],
  });
  if (!attempt) {
    const error = new Error("Copie introuvable ou non soumise");
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(grades) || grades.length !== exam.questions.length) {
    const error = new Error("Attribuez une note à chaque question avant d'enregistrer la correction.");
    error.statusCode = 400;
    throw error;
  }

  const questionById = new Map(exam.questions.map((question) => [String(question.id), question]));
  const gradeByQuestionId = new Map();
  for (const grade of grades) {
    if (!grade || typeof grade !== "object") {
      const error = new Error("Une note de correction est invalide.");
      error.statusCode = 400;
      throw error;
    }
    const question = questionById.get(String(grade.questionId));
    const pointsObtained = grade.pointsObtained;
    if (!question || gradeByQuestionId.has(String(grade.questionId))
      || typeof pointsObtained !== "number"
      || !Number.isFinite(pointsObtained)
      || pointsObtained < 0
      || pointsObtained > Number(question.points)) {
      const error = new Error("Une note de correction est invalide.");
      error.statusCode = 400;
      throw error;
    }
    if (grade.feedback !== undefined && grade.feedback !== null && typeof grade.feedback !== "string") {
      const error = new Error("Le commentaire de correction est invalide.");
      error.statusCode = 400;
      throw error;
    }
    gradeByQuestionId.set(String(grade.questionId), { pointsObtained, feedback: grade.feedback || null });
  }

  const transaction = await sequelize.transaction();
  try {
    const existingAnswers = new Map(attempt.answers.map((answer) => [String(answer.questionId), answer]));
    let score = 0;
    let totalPoints = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unansweredQuestions = 0;

    for (const question of exam.questions) {
      const answer = existingAnswers.get(String(question.id));
      const grade = gradeByQuestionId.get(String(question.id));
      const maxPoints = Number(question.points);
      const response = answer?.selectedOption ?? answer?.answerText;
      const isAnswered = response !== null && response !== undefined && String(response).trim() !== "";
      totalPoints += maxPoints;
      score += grade.pointsObtained;
      if (!isAnswered) unansweredQuestions += 1;
      else if (grade.pointsObtained >= maxPoints) correctAnswers += 1;
      else wrongAnswers += 1;

      const values = {
        pointsObtained: grade.pointsObtained,
        isCorrected: true,
        feedback: grade.feedback,
      };
      if (answer) await answer.update(values, { transaction });
      else await ExamAnswer.create({
        attemptId,
        questionId: question.id,
        selectedOption: null,
        answerText: null,
        ...values,
      }, { transaction });
    }

    const percentage = totalPoints ? (score / totalPoints) * 100 : 0;
    const gradedAt = new Date();
    await attempt.update({ status: "GRADED", score, totalPoints }, { transaction });
    const [result, created] = await ExamResult.findOrCreate({
      where: { attemptId },
      defaults: {
        studentId: attempt.studentId,
        examId,
        status: "PRESENT",
        score,
        totalPoints,
        totalQuestions: exam.questions.length,
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        percentage,
        submittedAt: attempt.submittedAt || gradedAt,
      },
      transaction,
    });
    if (!created) {
      await result.update({
        status: "PRESENT",
        score,
        totalPoints,
        totalQuestions: exam.questions.length,
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        percentage,
        submittedAt: attempt.submittedAt || gradedAt,
      }, { transaction });
    }
    await transaction.commit();
    return { attempt, result };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  startAttempt,
  getAttempt,
  submitAttempt,
  markAbsentStudents,
  getMyAttempts,
  getMyResults,
  getResult,
  getExamResults,
  getExamCopies,
  getCopyForCorrection,
  suggestExamCopyGrades,
  gradeExamCopy,
};