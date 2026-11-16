const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicClass = sequelize.define("AcademicClass", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  academicYearId: { type: DataTypes.INTEGER, allowNull: false },
  programId: { type: DataTypes.INTEGER, allowNull: false },
  levelId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "academic_classes",
  timestamps: true,
  indexes: [{ unique: true, fields: ["academicYearId", "programId", "levelId", "name"] }],
});

AcademicClass.associate = (models) => {
  AcademicClass.belongsTo(models.AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });
  AcademicClass.belongsTo(models.AcademicProgram, { foreignKey: "programId", as: "program" });
  AcademicClass.belongsTo(models.AcademicLevel, { foreignKey: "levelId", as: "level" });
  AcademicClass.belongsToMany(models.User, { through: models.AcademicClassTeacher, foreignKey: "academicClassId", otherKey: "teacherId", as: "teachers" });
  AcademicClass.hasMany(models.User, { foreignKey: "academicClassId", as: "students" });
};

module.exports = AcademicClass;
