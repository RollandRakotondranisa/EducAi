const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    extension: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "UPLOADED",
        "PROCESSING",
        "PROCESSED",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "UPLOADED",
    },
  },
  {
    tableName: "documents",
    timestamps: true,
  }
);

Document.associate = (models) => {
  Document.belongsTo(models.Course, {
    foreignKey: "courseId",
    as: "course",
  });

  Document.belongsTo(models.User, {
    foreignKey: "uploadedBy",
    as: "uploader",
  });

  Document.hasMany(models.DocumentHistory, {
    foreignKey: "documentId",
    as: "history",
    onDelete: "CASCADE",
  });
};

module.exports = Document;