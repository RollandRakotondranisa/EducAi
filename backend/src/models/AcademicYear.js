const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AcademicYear = sequelize.define("AcademicYear", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(20), allowNull: false },
  startsAt: { type: DataTypes.DATEONLY, allowNull: false },
  endsAt: { type: DataTypes.DATEONLY, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "academic_years", timestamps: true });

AcademicYear.associate = (models) => AcademicYear.hasMany(models.AcademicClass, { foreignKey: "academicYearId", as: "classes" });

module.exports = AcademicYear;
