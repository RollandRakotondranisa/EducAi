"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("answers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      attemptId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "exam_attempts",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "questions",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      selectedOptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,

        references: {
          model: "answer_options",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      answerText: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },

      pointsObtained: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },

      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      answeredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("answers");
  },
};