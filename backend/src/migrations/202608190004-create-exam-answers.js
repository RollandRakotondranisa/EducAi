"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("exam_answers", {
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
          model: "exam_questions",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      selectedOption: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      answerText: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      pointsObtained: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      isCorrected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      feedback: {
        type: Sequelize.TEXT,
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

    // Une question ne peut avoir qu'une seule réponse
    // dans une tentative donnée.
    await queryInterface.addConstraint("exam_answers", {
      fields: ["attemptId", "questionId"],
      type: "unique",
      name: "unique_exam_attempt_question",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("exam_answers");
  },
};