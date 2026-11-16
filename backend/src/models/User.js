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

    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    superAdminKey: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },

    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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

    avatar: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },

    specialty: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    classesHeld: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    university: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },

    academicTitle: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    matricule: {
      type: DataTypes.STRING(80),
      allowNull: true,
      unique: true,
    },

    level: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    program: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    studentProfileCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    academicClassId: {
      type: DataTypes.INTEGER,
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
  User.belongsTo(models.AcademicClass, {
    foreignKey: "academicClassId",
    as: "academicClass",
  });
  User.belongsToMany(models.AcademicClass, {
    through: models.AcademicClassTeacher,
    foreignKey: "teacherId",
    otherKey: "academicClassId",
    as: "teachingClasses",
  });

  User.hasMany(models.Course, {
    foreignKey: "teacherId",
    as: "courses",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  User.hasMany(models.Document, {
  foreignKey: "uploadedBy",
  as: "documents",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

  User.hasMany(models.DocumentHistory, {
    foreignKey: "userId",
    as: "documentHistory",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  User.hasMany(models.Exam, {
    foreignKey: "teacherId",
    as: "createdExams",
    onDelete: "RESTRICT",
  });
  User.belongsToMany(models.Course, {
    through: models.CourseStudent,
    foreignKey: "studentId",
    otherKey: "courseId",
    as: "enrolledCourses",
  });
  User.hasMany(models.ExamAttempt, {
    foreignKey: "studentId",
    as: "examAttempts",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  User.hasMany(models.ExamResult, {
    foreignKey: "studentId",
    as: "examResults",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  User.hasMany(models.Message, {
    foreignKey: "senderId",
    as: "sentMessages",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  User.hasMany(models.Message, {
    foreignKey: "recipientId",
    as: "receivedMessages",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
};

module.exports = User;
