const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicLevel = sequelize.define("AcademicLevel", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: "academic_levels", timestamps: true });

AcademicLevel.associate = (models) => AcademicLevel.hasMany(models.AcademicClass, { foreignKey: "levelId", as: "classes" });

module.exports = AcademicLevel;
