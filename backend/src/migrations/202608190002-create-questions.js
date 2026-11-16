"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("questions", {
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

      type: {
        type: Sequelize.ENUM(
          "QCM",
          "OPEN"
        ),
        allowNull: false,
      },

      statement: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      points: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1,
      },

      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable("questions");
  },
};