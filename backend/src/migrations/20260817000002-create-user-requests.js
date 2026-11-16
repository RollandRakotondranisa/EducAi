"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_requests", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      firstName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      lastName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      requestedRole: {
        type: Sequelize.ENUM("TEACHER", "STUDENT", "ADMIN"),
        allowNull: false,
        defaultValue: "STUDENT",
      },

      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },

      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      approvalReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },

      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("user_requests");
  },
};
