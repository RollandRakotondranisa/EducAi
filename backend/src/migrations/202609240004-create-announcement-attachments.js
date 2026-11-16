"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("announcement_attachments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      announcementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "announcements", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      originalName: { type: Sequelize.STRING(255), allowNull: false },
      storedName: { type: Sequelize.STRING(255), allowNull: false },
      mimeType: { type: Sequelize.STRING(120), allowNull: false },
      filePath: { type: Sequelize.STRING(500), allowNull: false },
      fileSize: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
      kind: { type: Sequelize.ENUM("FILE", "IMAGE"), allowNull: false, defaultValue: "FILE" },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("announcement_attachments", ["announcementId"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("announcement_attachments");
  },
};
