const {
  ExamAnswer,
  ExamAttempt,
  ExamQuestion,
} = require("../models");

// =====================================================
// SAUVEGARDER UNE REPONSE
// =====================================================

const saveAnswer = async ({
  attemptId,
  questionId,
  selectedOption,
  answerText,
  userId,
}) => {
  // Vérifier la tentative
  const attempt = await ExamAttempt.findOne({
    where: {
      id: attemptId,
      studentId: userId,
    },
  });

  if (!attempt) {
    const error = new Error(
      "Tentative d'examen introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  // Vérifier que l'examen n'est pas déjà soumis
  if (attempt.status !== "IN_PROGRESS") {
    const error = new Error(
      "Cette tentative est déjà soumise"
    );

    error.statusCode = 400;
    throw error;
  }

  if (attempt.expiresAt && new Date() >= new Date(attempt.expiresAt)) {
    const error = new Error("Le temps de l'examen est écoulé");
    error.statusCode = 400;
    throw error;
  }

  // Vérifier la question
  const question = await ExamQuestion.findOne({
    where: {
      id: questionId,
      examId: attempt.examId,
    },
  });

  if (!question) {
    const error = new Error(
      "Question introuvable pour cet examen"
    );

    error.statusCode = 404;
    throw error;
  }

  // Vérifier si une réponse existe déjà
  let answer = await ExamAnswer.findOne({
    where: {
      attemptId,
      questionId,
    },
  });

  if (answer) {
    answer.selectedOption =
      selectedOption ?? answer.selectedOption;

    answer.answerText =
      answerText ?? answer.answerText;

    await answer.save();

    return answer;
  }

  answer = await ExamAnswer.create({
    attemptId,
    questionId,
    selectedOption: selectedOption || null,
    answerText: answerText || null,
  });

  return answer;
};

// =====================================================
// OBTENIR LES REPONSES D'UNE TENTATIVE
// =====================================================

const getAttemptAnswers = async ({
  attemptId,
  userId,
}) => {
  const attempt = await ExamAttempt.findOne({
    where: {
      id: attemptId,
      studentId: userId,
    },
  });

  if (!attempt) {
    const error = new Error(
      "Tentative introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  return await ExamAnswer.findAll({
    where: {
      attemptId,
    },
    include: [
      {
        model: ExamQuestion,
        as: "question",
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

// =====================================================
// SUPPRIMER UNE REPONSE
// =====================================================

const deleteAnswer = async ({
  answerId,
  userId,
}) => {
  const answer = await ExamAnswer.findOne({
    where: {
      id: answerId,
    },
    include: [
      {
        model: ExamAttempt,
        as: "attempt",
        where: {
          studentId: userId,
        },
      },
    ],
  });

  if (!answer) {
    const error = new Error(
      "Réponse introuvable"
    );

    error.statusCode = 404;
    throw error;
  }

  if (answer.attempt.status !== "IN_PROGRESS") {
    const error = new Error(
      "Impossible de modifier une tentative soumise"
    );

    error.statusCode = 400;
    throw error;
  }

  await answer.destroy();

  return true;
};

module.exports = {
  saveAnswer,
  getAttemptAnswers,
  deleteAnswer,
};