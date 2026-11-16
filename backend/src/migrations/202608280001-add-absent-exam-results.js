"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("exam_attempts", "startedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn("exam_attempts", "status", {
      type: Sequelize.ENUM("IN_PROGRESS", "SUBMITTED", "GRADED", "ABSENT"),
      allowNull: false,
      defaultValue: "IN_PROGRESS",
    });
    await queryInterface.changeColumn("exam_results", "attemptId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn("exam_results", "submittedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("exam_results", "status", {
      type: Sequelize.ENUM("PRESENT", "ABSENT"),
      allowNull: false,
      defaultValue: "PRESENT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("exam_results", "status");
    await queryInterface.changeColumn("exam_results", "submittedAt", {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.changeColumn("exam_results", "attemptId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn("exam_attempts", "status", {
      type: Sequelize.ENUM("IN_PROGRESS", "SUBMITTED", "GRADED"),
      allowNull: false,
      defaultValue: "IN_PROGRESS",
    });
    await queryInterface.changeColumn("exam_attempts", "startedAt", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
