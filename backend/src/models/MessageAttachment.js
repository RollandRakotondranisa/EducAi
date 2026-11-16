const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageAttachment = sequelize.define(
  "MessageAttachment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "messages",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    storedName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    kind: {
      type: DataTypes.ENUM("FILE", "IMAGE"),
      allowNull: false,
      defaultValue: "FILE",
    },
  },
  {
    tableName: "message_attachments",
    timestamps: true,
  }
);

MessageAttachment.associate = (models) => {
  MessageAttachment.belongsTo(models.Message, {
    foreignKey: "messageId",
    as: "message",
    onDelete: "CASCADE",
  });
};

module.exports = MessageAttachment;
