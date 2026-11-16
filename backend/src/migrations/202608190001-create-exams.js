"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("exams", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "courses",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Durée en minutes",
      },

      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "DRAFT",
          "PUBLISHED",
          "CLOSED",
          "ARCHIVED"
        ),
        allowNull: false,
        defaultValue: "DRAFT",
      },

      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable("exams");
  },
};