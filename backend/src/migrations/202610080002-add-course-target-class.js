"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("courses", "targetAcademicClassId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "academic_classes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("courses", "targetAcademicClassId");
  },
};
