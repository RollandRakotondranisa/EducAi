"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("exam_questions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      examId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "exams",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      question: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM(
          "MCQ",
          "OPEN"
        ),
        allowNull: false,
      },

      points: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1,
      },

      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      options: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      correctAnswer: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP"
        ),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("exam_questions");
  },
};