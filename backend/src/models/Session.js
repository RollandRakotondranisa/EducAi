const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    refreshTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    deviceInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
  }
);

Session.associate = (models) => {
  Session.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });
};

module.exports = Session;