const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Question = sequelize.define(
  "Question",
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

    type: {
      type: DataTypes.ENUM("QCM", "OPEN"),
      allowNull: false,
    },

    statement: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    points: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1,
    },

    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "questions",
    timestamps: true,
  }
);

Question.associate = (models) => {
  Question.belongsTo(models.Exam, {
    foreignKey: "examId",
    as: "exam",
  });

  Question.hasMany(models.AnswerOption, {
    foreignKey: "questionId",
    as: "options",
    onDelete: "CASCADE",
  });

  Question.hasMany(models.Answer, {
    foreignKey: "questionId",
    as: "answers",
    onDelete: "CASCADE",
  });
};

module.exports = Question;