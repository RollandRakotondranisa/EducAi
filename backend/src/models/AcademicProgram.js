const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicProgram = sequelize.define("AcademicProgram", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: "academic_programs", timestamps: true });

AcademicProgram.associate = (models) => AcademicProgram.hasMany(models.AcademicClass, { foreignKey: "programId", as: "classes" });

module.exports = AcademicProgram;
