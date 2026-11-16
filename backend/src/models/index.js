const User = require("./User");
const Session = require("./Session");
const Course = require("./Course");
const CourseStudent = require("./CourseStudent");
const Audit = require("./Audit");
const UserRequest = require("./UserRequest");
const Document = require("./Document");
const DocumentHistory = require("./DocumentHistory");
const Exam = require("./Exam");
const ExamQuestion = require("./ExamQuestion");
const ExamAttempt = require("./ExamAttempt");
const ExamAnswer = require("./ExamAnswer");
const ExamResult = require("./ExamResult");
const Message = require("./Message");
const MessageAttachment = require("./MessageAttachment");
const Announcement = require("./Announcement");
const AnnouncementAttachment = require("./AnnouncementAttachment");
const AcademicYear = require("./AcademicYear");
const AcademicProgram = require("./AcademicProgram");
const AcademicLevel = require("./AcademicLevel");
const AcademicClass = require("./AcademicClass");
const AcademicClassTeacher = require("./AcademicClassTeacher");
const Organization = require("./Organization");
const { installTenantScopes } = require("../utils/tenant-context");
const models = {
  User,
  Session,
  Course,
  Audit,
  UserRequest,
  CourseStudent,
  Document,
  DocumentHistory,
  Exam,
  ExamQuestion,
  ExamAttempt,
  ExamAnswer,
  ExamResult,
  Message,
  MessageAttachment,
  Announcement,
  AnnouncementAttachment,
  AcademicYear,
  AcademicProgram,
  AcademicLevel,
  AcademicClass,
  AcademicClassTeacher,
  Organization,
};

installTenantScopes(models);

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

User.belongsTo(Organization, { foreignKey: "organizationId", as: "organization" });
Organization.hasMany(User, { foreignKey: "organizationId", as: "users" });

module.exports = models;