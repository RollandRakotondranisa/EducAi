"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("courses", "targetProgram", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("courses", "targetLevel", {
      type: Sequelize.STRING(80),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("courses", "targetLevel");
    await queryInterface.removeColumn("courses", "targetProgram");
  },
};