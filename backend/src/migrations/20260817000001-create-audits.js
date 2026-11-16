"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("audits", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      targetUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM("SUCCESS", "FAILED"),
        defaultValue: "SUCCESS",
      },

      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("audits");
  },
};
