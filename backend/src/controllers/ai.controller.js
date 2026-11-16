const aiService = require("../services/ai.service");

const studentCourseChat = async (req, res, next) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    const courseId = Number(req.params.courseId);
    if (!message || message.length > 4000 || !Number.isInteger(courseId) || courseId < 1) {
      const error = new Error("Le message et le cours sont requis");
      error.statusCode = 400;
      throw error;
    }
    const result = await aiService.askStudentCourseAssistant(req.user.id, courseId, message);
    return res.json({ success: true, answer: result.response, data: result });
  } catch (error) {
    return next(error);
  }
};

const documentChat = async (req, res, next) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    const documentId = Number(req.params.documentId);
    if (!message || message.length > 4000 || !Number.isInteger(documentId)) {
      const error = new Error("Le message et le document sont requis");
      error.statusCode = 400;
      throw error;
    }
    const result = await aiService.askDocumentAssistant(req.user.id, documentId, message);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 4000) {
      const error = new Error("Le message est requis et doit contenir au maximum 4000 caractères");
      error.statusCode = 400;
      throw error;
    }

    const courseId = req.body.courseId ? Number(req.body.courseId) : undefined;
    const documentId = req.body.documentId ? Number(req.body.documentId) : undefined;
    if ((courseId && !Number.isInteger(courseId)) || (documentId && !Number.isInteger(documentId))) {
      const error = new Error("Le cours ou le document sélectionné est invalide");
      error.statusCode = 400;
      throw error;
    }

    const result = req.user.role === "TEACHER" && (courseId || documentId)
      ? await aiService.askTeacherAssistant(req.user.id, message, courseId, documentId)
      : await aiService.askAssistant(req.user, message, { courseId, documentId });
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const adminChat = async (req, res, next) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 4000) {
      const error = new Error("Le message est requis et doit contenir au maximum 4000 caractères");
      error.statusCode = 400;
      throw error;
    }

    const result = await aiService.askAssistant(req.user, message, {});
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = { chat, adminChat, documentChat, studentCourseChat };