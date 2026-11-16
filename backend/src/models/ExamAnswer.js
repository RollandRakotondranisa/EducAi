const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExamAnswer = sequelize.define(
  "ExamAnswer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    attemptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Réponse sélectionnée pour un QCM
    selectedOption: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // Réponse libre de l'étudiant
    answerText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Nombre de points obtenus pour cette question
    pointsObtained: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },

    // Permet de savoir si la réponse a été corrigée
    isCorrected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // Feedback éventuel du correcteur / IA
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "exam_answers",
    timestamps: true,
  }
);

ExamAnswer.associate = (models) => {
  ExamAnswer.belongsTo(models.ExamAttempt, {
    foreignKey: "attemptId",
    as: "attempt",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  ExamAnswer.belongsTo(models.ExamQuestion, {
    foreignKey: "questionId",
    as: "question",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = ExamAnswer;