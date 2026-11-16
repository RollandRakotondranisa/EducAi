const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Announcement = sequelize.define(
  "Announcement",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetRole: {
      type: DataTypes.ENUM("STUDENT", "TEACHER", "ALL", "ADMIN"),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "announcements",
    timestamps: true,
  }
);

Announcement.associate = (models) => {
  Announcement.belongsTo(models.User, {
    foreignKey: "createdBy",
    as: "author",
  });

  Announcement.hasMany(models.AnnouncementAttachment, {
    foreignKey: "announcementId",
    as: "attachments",
    onDelete: "CASCADE",
  });
};

module.exports = Announcement;
