const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicClassTeacher = sequelize.define("AcademicClassTeacher", {
  academicClassId: { type: DataTypes.INTEGER, primaryKey: true },
  teacherId: { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: "academic_class_teachers", timestamps: true });

AcademicClassTeacher.associate = (models) => {
  AcademicClassTeacher.belongsTo(models.AcademicClass, { foreignKey: "academicClassId", as: "academicClass" });
  AcademicClassTeacher.belongsTo(models.User, { foreignKey: "teacherId", as: "teacher" });
};

module.exports = AcademicClassTeacher;
