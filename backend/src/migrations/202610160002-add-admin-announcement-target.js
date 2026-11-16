"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("announcements", "targetRole", {
      type: Sequelize.ENUM("STUDENT", "TEACHER", "ALL", "ADMIN"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate("announcements", { targetRole: "ALL" }, { targetRole: "ADMIN" });
    await queryInterface.changeColumn("announcements", "targetRole", {
      type: Sequelize.ENUM("STUDENT", "TEACHER", "ALL"),
      allowNull: false,
    });
  },
};
