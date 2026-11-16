const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Exam = sequelize.define(
  "Exam",
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

    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    targetProgram: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    targetLevel: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    targetAcademicClassId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    expectedQuestionCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Durée en minutes",
    },

    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PUBLISHED",
        "CLOSED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
  },
  {
    tableName: "exams",
    timestamps: true,
  }
);

Exam.associate = (models) => {
  Exam.belongsTo(models.AcademicClass, {
    foreignKey: "targetAcademicClassId",
    as: "targetClass",
  });

  Exam.belongsTo(models.Course, {
    foreignKey: "courseId",
    as: "course",
  });

  Exam.belongsTo(models.User, {
    foreignKey: "teacherId",
    as: "teacher",
  });

  Exam.hasMany(models.ExamQuestion, {
    foreignKey: "examId",
    as: "questions",
    onDelete: "CASCADE",
  });

  Exam.hasMany(models.ExamAttempt, {
    foreignKey: "examId",
    as: "attempts",
    onDelete: "CASCADE",
  });

  Exam.hasMany(models.ExamResult, {
    foreignKey: "examId",
    as: "results",
    onDelete: "CASCADE",
  });
};

module.exports = Exam;