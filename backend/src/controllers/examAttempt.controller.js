const examAttemptService = require(
  "../services/examAttempt.service"
);

// =====================================================
// START
// =====================================================

const startAttempt = async (
  req,
  res,
  next
) => {
  try {
    const attempt =
      await examAttemptService.startAttempt({
        examId: req.params.examId,
        studentId: req.user.id,
      });

    res.status(201).json({
      success: true,
      message: "Examen démarré",
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET
// =====================================================

const getAttempt = async (
  req,
  res,
  next
) => {
  try {
    const attempt =
      await examAttemptService.getAttempt({
        attemptId: req.params.id,
        studentId: req.user.id,
      });

    res.json({
      success: true,
      data: { ...attempt.toJSON(), serverNow: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SUBMIT
// =====================================================

const submitAttempt = async (
  req,
  res,
  next
) => {
  try {
    const attempt =
      await examAttemptService.submitAttempt({
        attemptId: req.params.id,
        studentId: req.user.id,
      });

    res.json({
      success: true,
      message: "Examen soumis avec succès",
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// MY ATTEMPTS
// =====================================================

const getMyAttempts = async (
  req,
  res,
  next
) => {
  try {
    const attempts =
      await examAttemptService.getMyAttempts({
        studentId: req.user.id,
      });

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAttempt,
  getAttempt,
  submitAttempt,
  getMyAttempts,
  getMyResults: async (req, res, next) => {
    try {
      const results = await examAttemptService.getMyResults({ studentId: req.user.id });
      res.json({ success: true, data: results });
    } catch (error) { next(error); }
  },
  getResult: async (req, res, next) => {
    try {
      const result = await examAttemptService.getResult({ resultId: req.params.id, studentId: req.user.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};