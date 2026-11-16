const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Organization = sequelize.define("Organization", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  normalizedName: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  isLegacy: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "organizations",
  timestamps: true,
});

module.exports = Organization;
