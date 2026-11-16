"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "matricule", { type: Sequelize.STRING(80), allowNull: true, unique: true });
    await queryInterface.addColumn("users", "level", { type: Sequelize.STRING(80), allowNull: true });
    await queryInterface.addColumn("users", "program", { type: Sequelize.STRING(150), allowNull: true });
    await queryInterface.addColumn("users", "phone", { type: Sequelize.STRING(30), allowNull: true });
    await queryInterface.addColumn("users", "studentProfileCompleted", { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "studentProfileCompleted");
    await queryInterface.removeColumn("users", "phone");
    await queryInterface.removeColumn("users", "program");
    await queryInterface.removeColumn("users", "level");
    await queryInterface.removeColumn("users", "matricule");
  },
};