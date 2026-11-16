const express = require("express");
const enrollmentRoutes = require("./routes/enrollment.routes");
const cors = require("cors");
const helmet = require("helmet");
const documentRoutes = require("./routes/document.routes");
const courseStudentRoutes = require("./routes/course-student.routes");
const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const examAnswerRoutes = require("./routes/examAnswer.routes");
const errorHandler = require("./middleware/error.middleware");
const examRoutes = require("./routes/exam.routes");
const examQuestionRoutes = require("./routes/examQuestion.routes");
const examAttemptRoutes = require("./routes/examAttempt.routes");
const aiRoutes = require("./routes/ai.routes");
const messageRoutes = require("./routes/message.routes");
const announcementRoutes = require("./routes/announcement.routes");
const academicRoutes = require("./routes/academic.routes");

const app = express();

// =====================================================
// SECURITE
// =====================================================

app.use(helmet());

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: "3mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "3mb",
  })
);

// All routes are registered after security, CORS and request-body middleware.
app.use("/api/documents", documentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-questions", examQuestionRoutes);
app.use("/api/exam-attempts", examAttemptRoutes);
app.use("/api/exam-answers", examAnswerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/academic", academicRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EduAI Backend fonctionne correctement",
  });
});

// =====================================================
// AUTHENTIFICATION
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// GESTION DES COURS
// =====================================================

app.use("/api/courses", courseRoutes);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use("/api/courses", courseStudentRoutes);

app.use(errorHandler);

module.exports = app;
