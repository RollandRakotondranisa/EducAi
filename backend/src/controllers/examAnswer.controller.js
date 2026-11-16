const examAnswerService = require("../services/examAnswer.service");

// =====================================================
// SAUVEGARDER / MODIFIER UNE REPONSE
// =====================================================

const saveAnswer = async (req, res, next) => {
  try {
    const {
      attemptId,
      questionId,
      selectedOption,
      answerText,
    } = req.body;

    const answer =
      await examAnswerService.saveAnswer({
        attemptId,
        questionId,
        selectedOption,
        answerText,
        userId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      message: "Réponse sauvegardée",
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// OBTENIR LES REPONSES
// =====================================================

const getAttemptAnswers = async (
  req,
  res,
  next
) => {
  try {
    const { attemptId } = req.params;

    const answers =
      await examAnswerService.getAttemptAnswers({
        attemptId,
        userId: req.user.id,
      });

    return res.status(200).json({
      success: true,
      data: answers,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SUPPRIMER UNE REPONSE
// =====================================================

const deleteAnswer = async (
  req,
  res,
  next
) => {
  try {
    const { answerId } = req.params;

    await examAnswerService.deleteAnswer({
      answerId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Réponse supprimée",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveAnswer,
  getAttemptAnswers,
  deleteAnswer,
};