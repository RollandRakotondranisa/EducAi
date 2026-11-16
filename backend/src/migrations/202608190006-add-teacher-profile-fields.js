"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "specialty", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "classesHeld", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "university", {
      type: Sequelize.STRING(180),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "academicTitle", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "bio", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "bio");
    await queryInterface.removeColumn("users", "academicTitle");
    await queryInterface.removeColumn("users", "university");
    await queryInterface.removeColumn("users", "classesHeld");
    await queryInterface.removeColumn("users", "specialty");
  },
};