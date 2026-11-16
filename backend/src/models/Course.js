const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
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

    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "courses",
    timestamps: true,
  }
);

Course.associate = (models) => {
  Course.belongsTo(models.AcademicClass, {
    foreignKey: "targetAcademicClassId",
    as: "targetClass",
  });

  Course.belongsTo(models.User, {
    foreignKey: "teacherId",
    as: "teacher",
  });

  Course.belongsToMany(models.User, {
    through: models.CourseStudent,
    foreignKey: "courseId",
    otherKey: "studentId",
    as: "students",
  });
  Course.hasMany(models.Exam, {
  foreignKey: "courseId",
  as: "exams",
  onDelete: "CASCADE",
});

  Course.hasMany(models.Document, {
    foreignKey: "courseId",
    as: "documents",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = Course;
