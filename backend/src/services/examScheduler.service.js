const { Exam, ExamAttempt } = require("../models");
const examAttemptService = require("./examAttempt.service");

let processing = false;

const processExpiredExams = async () => {
  if (processing) return;
  processing = true;
  try {
    const expiredAttempts = await ExamAttempt.findAll({ where: { status: "IN_PROGRESS", expiresAt: { [require("sequelize").Op.lte]: new Date() } } });
    for (const attempt of expiredAttempts) {
      try {
        await examAttemptService.submitAttempt({ attemptId: attempt.id, studentId: attempt.studentId });
      } catch (error) {
        console.error(`Unable to close expired attempt ${attempt.id}:`, error.message);
      }
    }
    const exams = await Exam.findAll({ where: { status: "PUBLISHED" } });
    for (const exam of exams) {
      await examAttemptService.markAbsentStudents({ examId: exam.id });
    }
  } finally {
    processing = false;
  }
};

module.exports = { processExpiredExams };
