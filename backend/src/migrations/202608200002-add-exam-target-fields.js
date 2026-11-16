"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("exams", "targetProgram", { type: Sequelize.STRING(150), allowNull: true });
    await queryInterface.addColumn("exams", "targetLevel", { type: Sequelize.STRING(80), allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("exams", "targetLevel");
    await queryInterface.removeColumn("exams", "targetProgram");
  },
};