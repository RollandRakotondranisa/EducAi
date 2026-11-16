const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DocumentHistory = sequelize.define(
  "DocumentHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    action: {
      type: DataTypes.ENUM(
        "UPLOAD",
        "VIEW",
        "DOWNLOAD",
        "DELETE"
      ),
      allowNull: false,
    },

    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "document_history",
    timestamps: true,
  }
);

DocumentHistory.associate = (models) => {
  DocumentHistory.belongsTo(models.Document, {
    foreignKey: "documentId",
    as: "document",
  });

  DocumentHistory.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });
};

module.exports = DocumentHistory;