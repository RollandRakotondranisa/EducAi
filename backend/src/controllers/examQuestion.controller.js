const service = require(
  "../services/examQuestion.service"
);

const createQuestion = async (
  req,
  res,
  next
) => {
  try {
    const question =
      await service.createQuestion({
        examId: req.params.examId,
        userId: req.user.id,
        ...req.body,
      });

    res.status(201).json({
      success: true,
      message: "Question créée",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (
  req,
  res,
  next
) => {
  try {
    const question =
      await service.updateQuestion({
        questionId: req.params.id,
        userId: req.user.id,
        ...req.body,
      });

    res.json({
      success: true,
      message: "Question modifiée",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (
  req,
  res,
  next
) => {
  try {
    await service.deleteQuestion({
      questionId: req.params.id,
      userId: req.user.id,
    });

    res.json({
      success: true,
      message: "Question supprimée",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  updateQuestion,
  deleteQuestion,
};