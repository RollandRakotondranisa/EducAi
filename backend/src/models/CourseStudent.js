const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseStudent = sequelize.define(
  "CourseStudent",
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

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "course_students",
    timestamps: true,
  }
);

CourseStudent.associate = (models) => {
  CourseStudent.belongsTo(models.Course, {
    foreignKey: "courseId",
    as: "course",
  });

  CourseStudent.belongsTo(models.User, {
    foreignKey: "studentId",
    as: "student",
  });
};

module.exports = CourseStudent;