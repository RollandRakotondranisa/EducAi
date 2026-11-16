"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("answer_options", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "questions",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable("answer_options");
  },
};