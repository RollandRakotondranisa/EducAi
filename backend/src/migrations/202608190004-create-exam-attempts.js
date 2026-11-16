"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("exam_attempts", {
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

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      submittedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "IN_PROGRESS",
          "SUBMITTED",
          "GRADED"
        ),
        allowNull: false,
        defaultValue: "IN_PROGRESS",
      },

      score: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },

      totalPoints: {
        type: Sequelize.DECIMAL(6, 2),
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
    await queryInterface.dropTable("exam_attempts");
  },
};