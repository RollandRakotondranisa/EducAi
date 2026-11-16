const {
  Exam,
  ExamQuestion,
} = require("../models");

// =====================================================
// CREER
// =====================================================

const createQuestion = async ({
  examId,
  userId,
  questionText,
  type,
  options,
  points,
}) => {
  const exam = await Exam.findByPk(examId, {
    include: [
      {
        association: "course",
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

  if (exam.course.teacherId !== userId) {
    const error = new Error(
      "Non autorisé"
    );

    error.statusCode = 403;
    throw error;
  }

  if (exam.status === "PUBLISHED") {
    const error = new Error(
      "Impossible de modifier un examen publié"
    );

    error.statusCode = 400;
    throw error;
  }

  const questionCount = await ExamQuestion.count({ where: { examId } });
  if (exam.expectedQuestionCount && questionCount >= exam.expectedQuestionCount) {
    const error = new Error(`Le nombre prévu de ${exam.expectedQuestionCount} questions est déjà atteint`);
    error.statusCode = 400;
    throw error;
  }

  return await ExamQuestion.create({
    examId,
    question: questionText,
    type,
    options,
    points,
  });
};

// =====================================================
// MODIFIER
// =====================================================

const updateQuestion = async ({
  questionId,
  userId,
  questionText,
  type,
  options,
  points,
}) => {
  const question =
    await ExamQuestion.findByPk(
      questionId,
      {
        include: [
          {
            model: Exam,
            as: "exam",
            include: [
              {
                association: "course",
              },
            ],
          },
        ],
      }
    );

  if (!question) {
    const error = new Error(
      "Question introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (
    question.exam.course.teacherId !== userId
  ) {
    const error = new Error(
      "Non autorisé"
    );

    error.statusCode = 403;
    throw error;
  }

  if (question.exam.status === "PUBLISHED") {
    const error = new Error("Impossible de modifier une question d'examen publié");
    error.statusCode = 400;
    throw error;
  }

  await question.update({
    question: questionText,
    type,
    options,
    points,
  });

  return question;
};

// =====================================================
// SUPPRIMER
// =====================================================

const deleteQuestion = async ({
  questionId,
  userId,
}) => {
  const question =
    await ExamQuestion.findByPk(
      questionId,
      {
        include: [
          {
            model: Exam,
            as: "exam",
            include: [
              {
                association: "course",
              },
            ],
          },
        ],
      }
    );

  if (!question) {
    const error = new Error(
      "Question introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (
    question.exam.course.teacherId !== userId
  ) {
    const error = new Error(
      "Non autorisé"
    );

    error.statusCode = 403;
    throw error;
  }

  if (question.exam.status === "PUBLISHED") {
    const error = new Error("Impossible de supprimer une question d'examen publié");
    error.statusCode = 400;
    throw error;
  }

  await question.destroy();

  return true;
};

module.exports = {
  createQuestion,
  updateQuestion,
  deleteQuestion,
};