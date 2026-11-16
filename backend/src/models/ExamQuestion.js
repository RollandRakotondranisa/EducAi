const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamQuestion = sequelize.define(
  "ExamQuestion",
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

    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM(
        "MCQ",
        "OPEN"
      ),
      allowNull: false,
    },

    points: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1,
    },

    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "exam_questions",
    timestamps: true,
  }
);

ExamQuestion.associate = (models) => {
  ExamQuestion.belongsTo(models.Exam, {
    foreignKey: "examId",
    as: "exam",
  });

  ExamQuestion.hasMany(models.ExamAnswer, {
    foreignKey: "questionId",
    as: "answers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = ExamQuestion;
