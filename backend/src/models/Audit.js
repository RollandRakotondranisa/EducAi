const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Audit = sequelize.define(
  "Audit",
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

    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "e.g., 'LOGIN', 'LOGOUT', 'CREATE_USER', 'DELETE_USER', 'APPROVE_USER', 'REJECT_USER', 'UPDATE_USER'",
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID de l'utilisateur affecté par l'action (si applicable)",
    },

    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      defaultValue: "SUCCESS",
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Données supplémentaires JSON pour l'audit",
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audits",
    timestamps: false,
  }
);

module.exports = Audit;
