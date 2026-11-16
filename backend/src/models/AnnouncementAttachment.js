const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AnnouncementAttachment = sequelize.define(
  "AnnouncementAttachment",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    announcementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "announcements", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    storedName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(120), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    kind: { type: DataTypes.ENUM("FILE", "IMAGE"), allowNull: false, defaultValue: "FILE" },
  },
  { tableName: "announcement_attachments", timestamps: true }
);

AnnouncementAttachment.associate = (models) => {
  AnnouncementAttachment.belongsTo(models.Announcement, {
    foreignKey: "announcementId",
    as: "announcement",
  });
};

module.exports = AnnouncementAttachment;
