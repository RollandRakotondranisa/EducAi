const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("ADMIN", "TEACHER", "STUDENT"),
      allowNull: false,
      defaultValue: "STUDENT",
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);
User.associate = (models) => {
  User.hasMany(models.Session, {
    foreignKey: "userId",
    as: "sessions",
    onDelete: "CASCADE",
  });
};

module.exports = User;