"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("documents", {
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

      uploadedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      fileName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      filePath: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },

      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      fileSize: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },

      extension: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "UPLOADED",
          "PROCESSING",
          "PROCESSED",
          "ERROR"
        ),
        allowNull: false,
        defaultValue: "UPLOADED",
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
    await queryInterface.dropTable("documents");
  },
};