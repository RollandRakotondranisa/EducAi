"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      refreshTokenHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      deviceInfo: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex(
      "sessions",
      ["userId"]
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sessions");
  },
};