const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  }
);

Message.associate = (models) => {
  Message.belongsTo(models.User, {
    foreignKey: "senderId",
    as: "sender",
  });

  Message.belongsTo(models.User, {
    foreignKey: "recipientId",
    as: "recipient",
  });

  Message.hasMany(models.MessageAttachment, {
    foreignKey: "messageId",
    as: "attachments",
    onDelete: "CASCADE",
  });
};

module.exports = Message;
