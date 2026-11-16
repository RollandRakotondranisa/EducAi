const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamResult = sequelize.define(
  "ExamResult",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    examId: { type: DataTypes.INTEGER, allowNull: false },
    attemptId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    status: { type: DataTypes.ENUM("PRESENT", "ABSENT"), allowNull: false, defaultValue: "PRESENT" },
    score: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalPoints: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalQuestions: { type: DataTypes.INTEGER, allowNull: false },
    correctAnswers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    wrongAnswers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unansweredQuestions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "exam_results", timestamps: true }
);

ExamResult.associate = (models) => {
  ExamResult.belongsTo(models.User, { foreignKey: "studentId", as: "student" });
  ExamResult.belongsTo(models.Exam, { foreignKey: "examId", as: "exam" });
  ExamResult.belongsTo(models.ExamAttempt, { foreignKey: "attemptId", as: "attempt" });
};

module.exports = ExamResult;
