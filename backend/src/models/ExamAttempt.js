const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamAttempt = sequelize.define(
  "ExamAttempt",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "IN_PROGRESS",
        "SUBMITTED",
        "GRADED",
        "ABSENT"
      ),
      allowNull: false,
      defaultValue: "IN_PROGRESS",
    },

    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },

    totalPoints: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
  },
  {
    tableName: "exam_attempts",
    timestamps: true,
  }
);

ExamAttempt.associate = (models) => {
  ExamAttempt.belongsTo(models.Exam, {
    foreignKey: "examId",
    as: "exam",
  });

  ExamAttempt.belongsTo(models.User, {
    foreignKey: "studentId",
    as: "student",
  });

  ExamAttempt.hasMany(models.ExamAnswer, {
    foreignKey: "attemptId",
    as: "answers",
    onDelete: "CASCADE",
  });

  ExamAttempt.hasOne(models.ExamResult, {
    foreignKey: "attemptId",
    as: "result",
    onDelete: "CASCADE",
  });
};

module.exports = ExamAttempt;
