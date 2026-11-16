"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("exam_results", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      studentId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "users", key: "id" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
      examId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "exams", key: "id" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
      attemptId: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: "exam_attempts", key: "id" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
      score: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      totalPoints: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      totalQuestions: { type: Sequelize.INTEGER, allowNull: false },
      correctAnswers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      wrongAnswers: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      unansweredQuestions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      submittedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("exam_results");
  },
};
