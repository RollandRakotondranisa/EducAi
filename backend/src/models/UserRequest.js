const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserRequest = sequelize.define(
  "UserRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    requestedRole: {
      type: DataTypes.ENUM("TEACHER", "STUDENT", "ADMIN"),
      allowNull: false,
      defaultValue: "STUDENT",
    },

    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID de l'admin qui a approuvé/rejeté",
    },

    approvalReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Raison de l'approbation ou du rejet",
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "user_requests",
    timestamps: false,
  }
);

module.exports = UserRequest;
