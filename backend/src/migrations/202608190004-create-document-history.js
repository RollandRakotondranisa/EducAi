"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("document_history", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      documentId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "documents",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      action: {
        type: Sequelize.ENUM(
          "UPLOAD",
          "VIEW",
          "DOWNLOAD",
          "DELETE"
        ),
        allowNull: false,
      },

      details: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("document_history");
  },
};