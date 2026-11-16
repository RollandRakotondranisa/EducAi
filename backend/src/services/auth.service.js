
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const sequelize = require("../config/database");
const User = require("../models/User");
const Session = require("../models/Session");
const Audit = require("../models/Audit");
const UserRequest = require("../models/UserRequest");
const Organization = require("../models/Organization");
const models = require("../models");
const Course = require("../models/Course");
const CourseStudent = require("../models/CourseStudent");
const Document = require("../models/Document");
const DocumentHistory = require("../models/DocumentHistory");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ExamResult = require("../models/ExamResult");
const Message = require("../models/Message");
const MessageAttachment = require("../models/MessageAttachment");
const Announcement = require("../models/Announcement");
const AnnouncementAttachment = require("../models/AnnouncementAttachment");
const AcademicYear = require("../models/AcademicYear");
const AcademicProgram = require("../models/AcademicProgram");
const AcademicLevel = require("../models/AcademicLevel");
const AcademicClass = require("../models/AcademicClass");
const academicService = require("./academic.service");
const { logAudit, getAuditLogs } = require("../utils/audit");
const { getApprovedAdminUserIds } = require("../utils/approved-admins");
const { sendInvitationEmail, sendUserCreatedEmail } = require("./email.service");
const { askAdminReportAssistant } = require("./ai.service");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

const { hashToken } = require("../utils/hash");

const buildAdminReportSummary = ({
  totalUsers = 0,
  totalTeachers = 0,
  totalStudents = 0,
  totalAdmins = 0,
  totalCourses = 0,
  totalExams = 0,
  publishedExams = 0,
  activeUsers = 0,
  pendingRequests = 0,
  recentAudit = [],
} = {}) => {
  const healthScore = Math.max(
    0,
    Math.min(100, Math.round(((activeUsers / Math.max(1, totalUsers)) * 60) + ((publishedExams / Math.max(1, totalExams)) * 25) + ((pendingRequests <= 10 ? 15 : 0))))
  );

  return {
    summary: {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      totalCourses,
      totalExams,
      publishedExams,
      activeUsers,
      pendingRequests,
      healthScore,
      generatedAt: new Date().toISOString(),
    },
    kpis: [
      { label: "Utilisateurs total", value: totalUsers, trend: "+8%", tone: "primary" },
      { label: "Étudiants", value: totalStudents, trend: "+12%", tone: "student" },
      { label: "Enseignants", value: totalTeachers, trend: "+4%", tone: "teacher" },
      { label: "Cours actifs", value: totalCourses, trend: "+6%", tone: "info" },
      { label: "Examens publiés", value: publishedExams, trend: "+10%", tone: "success" },
      { label: "Demandes à traiter", value: pendingRequests, trend: pendingRequests > 0 ? "À revoir" : "OK", tone: pendingRequests > 0 ? "warning" : "success" },
    ],
    recentAudit: Array.isArray(recentAudit) ? recentAudit.slice(0, 8).map((item) => ({
      action: item.action,
      description: item.description,
      createdAt: item.createdAt,
      status: item.status || "SUCCESS",
    })) : [],
    insights: [
      `${activeUsers} utilisateurs sont actifs sur la plateforme, soit ${Math.round((activeUsers / Math.max(1, totalUsers)) * 100)}% du total.`,
      `${publishedExams} examens sont publiés sur ${Math.max(1, totalExams)} examens enregistrés.`,
      pendingRequests > 0
        ? `${pendingRequests} demandes d’inscription ou de validation restent en attente.`
        : "Aucune demande de validation n’est actuellement en attente.",
    ],
    export: {
      csv: true,
      pdf: true,
      xlsx: true,
    },
  };
};

const buildAdminReportRecommendations = (summary) => {
  const recommendations = [];
  const activeRate = summary.activeUsers / Math.max(1, summary.totalUsers);
  const publicationRate = summary.publishedExams / Math.max(1, summary.totalExams);

  if (summary.pendingRequests > 0) {
    recommendations.push({
      priority: "high",
      title: "Traiter les demandes en attente",
      action: `Examiner les ${summary.pendingRequests} demande(s) en attente et décider de leur validation.`,
      reason: "Les demandes non traitées ralentissent l'activation des utilisateurs.",
    });
  }
  if (activeRate < 0.6) {
    recommendations.push({
      priority: "medium",
      title: "Relancer les utilisateurs inactifs",
      action: `Analyser les comptes inactifs et lancer une campagne de relance ciblée.`,
      reason: `Le taux d'activité actuel est de ${Math.round(activeRate * 100)}%.`,
    });
  }
  if (summary.totalExams > 0 && publicationRate < 0.5) {
    recommendations.push({
      priority: "medium",
      title: "Accélérer la publication des examens",
      action: "Identifier les examens en brouillon et accompagner les enseignants concernés.",
      reason: `Seuls ${Math.round(publicationRate * 100)}% des examens sont publiés.`,
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      priority: "low",
      title: "Maintenir la surveillance",
      action: "Continuer le suivi hebdomadaire des indicateurs et des journaux d'audit.",
      reason: "Aucune priorité critique n'a été détectée dans les indicateurs actuels.",
    });
  }
  return recommendations;
};


// =====================================================
// REGISTER
// =====================================================

const register = async ({
  firstName,
  lastName,
  email,
  password,
  role,
  institutionName,
}) => {

  // ---------------------------------------------
  // 1. Vérifier si l'utilisateur existe
  // ---------------------------------------------

  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    const error = new Error("Cette adresse email est déjà utilisée");
    error.statusCode = 409;
    throw error;
  }

  // ---------------------------------------------
  // 2. Hasher le mot de passe
  // ---------------------------------------------

  const hashedPassword = await bcrypt.hash(password, 12);

  // ---------------------------------------------
  // 3. Déterminer le rôle demandé
  // ---------------------------------------------

  const requestedRole = ["TEACHER", "STUDENT", "ADMIN"].includes(String(role || "").toUpperCase())
    ? String(role).toUpperCase()
    : "STUDENT";
  const name = typeof institutionName === "string" ? institutionName.trim() : "";
  if (!name || name.length > 180) {
    const error = new Error("Le nom de l'école ou de l'université est obligatoire (180 caractères maximum).");
    error.statusCode = 400;
    throw error;
  }
  const normalizedName = name.toLocaleLowerCase("fr").replace(/\s+/g, " ");
  const [organization] = await Organization.findOrCreate({
    where: { normalizedName },
    defaults: { name, normalizedName },
  });
  if (organization.isLegacy) {
    const error = new Error("Cet établissement est réservé au rattachement des données historiques.");
    error.statusCode = 400;
    throw error;
  }

  // ---------------------------------------------
  // 4. Créer l'utilisateur en attente de validation
  // ---------------------------------------------

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role: requestedRole,
    isActive: false,
    organizationId: organization.id,
  });

  // ---------------------------------------------
  // 5. Créer une demande d'activation pour l'admin
  // ---------------------------------------------

  await UserRequest.create({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    requestedRole,
    status: "PENDING",
    organizationId: organization.id,
  });

  await logAudit(
    user.id,
    "REGISTER_PENDING",
    `Nouvel utilisateur créé et en attente de validation par l'admin. Rôle demandé: ${requestedRole}`,
    user.id,
    { status: "SUCCESS", organizationId: organization.id }
  );

  // ---------------------------------------------
  // 6. Retourner les informations publiques
  // ---------------------------------------------

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: "PENDING",
    organizationName: organization.name,
    createdAt: user.createdAt,
  };
};


// =====================================================
// LOGIN
// =====================================================

const login = async ({
  email,
  password,
  deviceInfo,
  ipAddress,
}) => {

  // ---------------------------------------------
  // 1. Rechercher l'utilisateur
  // ---------------------------------------------

  const user = await User.findOne({
    where: { email },
  });


  if (!user) {

    const error = new Error(
      "Email ou mot de passe incorrect"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 2. Vérifier si le compte est actif
  // ---------------------------------------------

  if (user.isActive === false) {
    const error = new Error(
      "Votre compte est désactivé ou en attente d'activation. Contactez un administrateur pour rétablir l'accès."
    );

    error.statusCode = 403;

    throw error;
  }


  // ---------------------------------------------
  // 3. Vérifier le mot de passe
  // ---------------------------------------------

  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!isPasswordValid) {

    const error = new Error(
      "Email ou mot de passe incorrect"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 4. Créer la session
  // ---------------------------------------------

  const session = await Session.create({

    userId: user.id,

    deviceInfo:
      deviceInfo || "Unknown device",

    ipAddress:
      ipAddress || null,

    expiresAt: new Date(
      Date.now() +
      7 * 24 * 60 * 60 * 1000
    ),

    // Valeur temporaire.
    // Elle sera remplacée juste après.
    refreshTokenHash: "temporary",

  });


  // ---------------------------------------------
  // 5. Générer Access Token
  // ---------------------------------------------

  const accessToken =
    generateAccessToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 6. Générer Refresh Token
  // ---------------------------------------------

  const refreshToken =
    generateRefreshToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 7. Hasher le Refresh Token
  // ---------------------------------------------

  session.refreshTokenHash =
    hashToken(refreshToken);


  // ---------------------------------------------
  // 8. Sauvegarder la session
  // ---------------------------------------------

  await session.save();


  // ---------------------------------------------
  // 9. Retourner la réponse
  // ---------------------------------------------

  const organization = user.organizationId
    ? await Organization.findByPk(user.organizationId, { attributes: ["id", "name"] })
    : null;
  return {

    user: {

      id: user.id,

      firstName: user.firstName,

      lastName: user.lastName,

      email: user.email,

      role: user.role,

      matricule: user.matricule,

      level: user.level,

      program: user.program,

      phone: user.phone,

      studentProfileCompleted: user.studentProfileCompleted,
      organizationId: user.organizationId,
      organizationName: organization?.name || null,
      isSuperAdmin: Boolean(user.isSuperAdmin),

    },

    accessToken,

    refreshToken,

    session: {

      id: session.id,

      deviceInfo: session.deviceInfo,

      ipAddress: session.ipAddress,

      expiresAt: session.expiresAt,

    },

  };
};


// =====================================================
// REFRESH TOKEN
// =====================================================

const refresh = async (refreshToken) => {

  // ---------------------------------------------
  // 1. Vérifier la présence du token
  // ---------------------------------------------

  if (!refreshToken) {

    const error = new Error(
      "Refresh token manquant"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 2. Vérifier le JWT
  // ---------------------------------------------

  let decoded;

  try {

    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

  } catch (error) {

    const authError = new Error(
      "Refresh token invalide ou expiré"
    );

    authError.statusCode = 401;

    throw authError;
  }


  // ---------------------------------------------
  // 3. Vérifier sessionId
  // ---------------------------------------------

  if (!decoded.sessionId) {

    const error = new Error(
      "Session invalide"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 4. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findByPk(
      decoded.sessionId
    );


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 5. Vérifier si la session est révoquée
  // ---------------------------------------------

  if (session.revokedAt) {

    const error = new Error(
      "Cette session a été révoquée"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 6. Vérifier expiration
  // ---------------------------------------------

  if (
    new Date() >
    new Date(session.expiresAt)
  ) {

    const error = new Error(
      "Cette session a expiré"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 7. Vérifier le hash du token
  // ---------------------------------------------

  const tokenHash =
    hashToken(refreshToken);


  if (
    tokenHash !==
    session.refreshTokenHash
  ) {

    const error = new Error(
      "Refresh token invalide"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 8. Rechercher l'utilisateur
  // ---------------------------------------------

  const user =
    await User.findByPk(
      session.userId
    );


  if (!user) {

    const error = new Error(
      "Utilisateur introuvable"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 9. Vérifier le compte
  // ---------------------------------------------

  if (user.isActive === false) {

    const error = new Error(
      "Votre compte est désactivé"
    );

    error.statusCode = 403;

    throw error;
  }


  // ---------------------------------------------
  // 10. Générer nouveau Access Token
  // ---------------------------------------------

  const newAccessToken =
    generateAccessToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 11. Générer nouveau Refresh Token
  // ---------------------------------------------

  const newRefreshToken =
    generateRefreshToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 12. Rotation du Refresh Token
  // ---------------------------------------------

  session.refreshTokenHash =
    hashToken(newRefreshToken);


  await session.save();


  // ---------------------------------------------
  // 13. Retourner les nouveaux tokens
  // ---------------------------------------------

  return {

    accessToken:
      newAccessToken,

    refreshToken:
      newRefreshToken,

  };
};


// =====================================================
// LOGOUT — SESSION COURANTE
// =====================================================

const logout = async (
  userId,
  sessionId
) => {

  // ---------------------------------------------
  // 1. Vérifier sessionId
  // ---------------------------------------------

  if (!sessionId) {

    const error = new Error(
      "Session ID manquant"
    );

    error.statusCode = 400;

    throw error;
  }


  // ---------------------------------------------
  // 2. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findOne({

      where: {

        id: sessionId,

        userId: userId,

      },

    });


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // ---------------------------------------------
  // 3. Révoquer la session
  // ---------------------------------------------

  session.revokedAt =
    new Date();


  await session.save();


  return true;
};


// =====================================================
// GET ALL SESSIONS
// =====================================================

const getSessions = async (userId) => {

  const sessions =
    await Session.findAll({

      where: {
        userId: userId,
      },

      attributes: [

        "id",

        "deviceInfo",

        "ipAddress",

        "expiresAt",

        "revokedAt",

        "createdAt",

        "updatedAt",

      ],

      order: [
        ["createdAt", "DESC"],
      ],

    });


  return sessions;
};


// =====================================================
// REVOKE ONE SESSION
// =====================================================

const revokeSession = async (
  userId,
  sessionId
) => {

  // ---------------------------------------------
  // 1. Vérifier sessionId
  // ---------------------------------------------

  if (!sessionId) {

    const error = new Error(
      "Session ID manquant"
    );

    error.statusCode = 400;

    throw error;
  }


  // ---------------------------------------------
  // 2. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findOne({

      where: {

        id: sessionId,

        userId: userId,

      },

    });


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // ---------------------------------------------
  // 3. Révoquer
  // ---------------------------------------------

  session.revokedAt =
    new Date();


  await session.save();


  return true;
};


// =====================================================
// LOGOUT ALL
// =====================================================

const logoutAll = async (userId) => {

  await Session.update(

    {
      revokedAt: new Date(),
    },

    {
      where: {

        userId: userId,

        revokedAt: null,

      },
    }

  );


  return true;
};


const getOwnProfile = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ["id", "firstName", "lastName", "email", "role", "isActive", "isSuperAdmin", "organizationId", "avatar", "specialty", "classesHeld", "university", "academicTitle", "bio", "matricule", "level", "program", "phone", "studentProfileCompleted", "academicClassId", "createdAt", "updatedAt"] });
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  const profile = user.toJSON();
  profile.organization = user.organizationId
    ? await Organization.findByPk(user.organizationId, { attributes: ["id", "name"] })
    : null;
  profile.isSuperAdmin = Boolean(user.isSuperAdmin);
  if (user.role === "STUDENT" && user.academicClassId) {
    profile.academicClass = await AcademicClass.findByPk(user.academicClassId, {
      include: [
        { model: AcademicYear, as: "academicYear", attributes: ["id", "name"] },
        { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
        { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
      ],
    });
  }
  if (user.role === "TEACHER") {
    profile.assignedClasses = await academicService.getAssignedClasses(user.id);
  }
  return profile;
};

const updateOwnProfile = async (userId, { firstName, lastName, email, specialty, university, academicTitle, bio, matricule, level, program, phone, academicClassId }) => {
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) { const error = new Error("Prénom, nom et adresse e-mail sont requis"); error.statusCode = 400; throw error; }
  const user = await User.findByPk(userId);
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  if (user.role === "STUDENT") {
    if (user.studentProfileCompleted) {
      const error = new Error("Les informations étudiant sont modifiables uniquement par l'administrateur");
      error.statusCode = 403;
      throw error;
    }
    if (!matricule?.trim() || !phone?.trim() || !Number.isInteger(Number(academicClassId)) || Number(academicClassId) < 1) {
      const error = new Error("Nom complet, matricule, année, parcours, niveau, classe et téléphone sont obligatoires");
      error.statusCode = 400;
      throw error;
    }
    const academicClass = await AcademicClass.findOne({
      where: { id: Number(academicClassId) },
      include: [
        { model: AcademicYear, as: "academicYear", where: { isActive: true } },
        { model: AcademicProgram, as: "program", where: { isActive: true } },
        { model: AcademicLevel, as: "level", where: { isActive: true } },
      ],
    });
    if (!academicClass) {
      const error = new Error("La classe sélectionnée n'appartient pas à l'année universitaire active.");
      error.statusCode = 400;
      throw error;
    }
    const existingMatricule = await User.findOne({ where: { matricule: matricule.trim() } });
    if (existingMatricule && existingMatricule.id !== user.id) {
      const error = new Error("Ce matricule est déjà utilisé");
      error.statusCode = 409;
      throw error;
    }
    await user.update({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      matricule: matricule.trim(),
      level: academicClass.level.name,
      program: academicClass.program.name,
      phone: phone.trim(),
      academicClassId: academicClass.id,
      studentProfileCompleted: true,
    });
    await logAudit(userId, "COMPLETE_STUDENT_PROFILE", "Profil étudiant complété", userId, { status: "SUCCESS" });
    return getOwnProfile(userId);
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== user.email && await User.findOne({ where: { email: normalizedEmail } })) { const error = new Error("Cette adresse e-mail est déjà utilisée"); error.statusCode = 409; throw error; }
  await user.update({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    specialty: specialty?.trim() || null,
    university: university?.trim() || null,
    academicTitle: academicTitle?.trim() || null,
    bio: bio?.trim() || null,
  });
  await logAudit(userId, "UPDATE_PROFILE", "Informations personnelles mises à jour", userId, { status: "SUCCESS" });
  return getOwnProfile(userId);
};

const changeOwnPassword = async (userId, currentPassword, newPassword, sessionId) => {
  if (!currentPassword || !newPassword) { const error = new Error("Les deux mots de passe sont requis"); error.statusCode = 400; throw error; }
  if (newPassword.length < 8) { const error = new Error("Le nouveau mot de passe doit contenir au moins 8 caractères"); error.statusCode = 400; throw error; }
  const user = await User.findByPk(userId);
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  if (!await bcrypt.compare(currentPassword, user.password)) { const error = new Error("Le mot de passe actuel est incorrect"); error.statusCode = 400; throw error; }
  if (await bcrypt.compare(newPassword, user.password)) { const error = new Error("Le nouveau mot de passe doit être différent de l'ancien"); error.statusCode = 400; throw error; }
  await user.update({ password: await bcrypt.hash(newPassword, 12) });
  await Session.update({ revokedAt: new Date() }, { where: { userId, id: { [Op.ne]: sessionId }, revokedAt: null } });
  await logAudit(userId, "CHANGE_PASSWORD", "Mot de passe modifié", userId, { status: "SUCCESS" });
};

const updateOwnAvatar = async (userId, avatar) => {
  if (typeof avatar !== "string" || !/^data:image\/(png|jpeg);base64,/.test(avatar)) { const error = new Error("La photo doit être une image PNG ou JPG"); error.statusCode = 400; throw error; }
  if (avatar.length > 2800000) { const error = new Error("La photo ne doit pas dépasser 2 Mo"); error.statusCode = 400; throw error; }
  const user = await User.findByPk(userId);
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  await user.update({ avatar });
  await logAudit(userId, "UPDATE_AVATAR", "Photo de profil mise à jour", userId, { status: "SUCCESS" });
  return getOwnProfile(userId);
};

// =====================================================
// GET ALL USERS (ADMIN)
// =====================================================

const getAllUsers = async (requestingUser = {}) => {
  try {
    const isSuperAdmin = Boolean(requestingUser.isSuperAdmin);
    const approvedAdminIds = isSuperAdmin ? await getApprovedAdminUserIds() : null;
    const [users, pendingRequests] = await Promise.all([
      User.findAll({
        ...(isSuperAdmin
          ? { where: { role: "ADMIN", id: { [Op.in]: approvedAdminIds } } }
          : {}),
        attributes: ["id", "firstName", "lastName", "email", "role", "isActive", "isSuperAdmin", "organizationId", "avatar", "specialty", "classesHeld", "university", "academicTitle", "bio", "matricule", "level", "program", "phone", "studentProfileCompleted", "academicClassId", "createdAt", "updatedAt"],
        order: [["createdAt", "DESC"]],
      }),
      isSuperAdmin
        ? Promise.resolve([])
        : UserRequest.findAll({ where: { status: "PENDING" }, attributes: ["userId"], raw: true }),
    ]);
    const pendingUserIds = new Set(pendingRequests.map((request) => Number(request.userId)));

    const organizationIds = [...new Set(users.map((user) => user.organizationId).filter(Boolean))];
    const organizations = organizationIds.length
      ? await Organization.findAll({ where: { id: organizationIds }, attributes: ["id", "name"] })
      : [];
    const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      role: user.role.toLowerCase() === "admin" ? "admin" : user.role.toLowerCase() === "teacher" ? "teacher" : "student",
      status: user.isActive ? "active" : pendingUserIds.has(user.id) ? "pending" : "suspended",
      isActive: user.isActive,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      organizationId: user.organizationId,
      organizationName: organizationNames.get(user.organizationId) || null,
      lastLogin: "N/A",
      courses: 0,
      academicClassId: user.academicClassId,
      matricule: user.matricule,
      level: user.level,
      program: user.program,
      phone: user.phone,
      studentProfileCompleted: user.studentProfileCompleted,
      specialty: user.specialty,
      classesHeld: user.classesHeld,
      university: user.university,
      academicTitle: user.academicTitle,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  } catch (error) {
    const err = new Error("Erreur lors de la récupération des utilisateurs");
    err.statusCode = 500;
    throw err;
  }
};

const getStudentsForTeacher = async (teacherId) => academicService.getStudentsForTeacher(teacherId);


const getUserById = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ["id", "firstName", "lastName", "email", "role", "isActive", "isSuperAdmin", "organizationId", "avatar", "specialty", "classesHeld", "university", "academicTitle", "bio", "matricule", "level", "program", "phone", "studentProfileCompleted", "academicClassId", "createdAt", "updatedAt"] });
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  const pendingRequest = !user.isActive && await UserRequest.findOne({ where: { userId: user.id, status: "PENDING" }, attributes: ["id"] });
  const organization = user.organizationId
    ? await Organization.findByPk(user.organizationId, { attributes: ["id", "name"] })
    : null;
  return { ...user.toJSON(), organization, status: user.isActive ? "active" : pendingRequest ? "pending" : "suspended" };
};

const createUserByAdmin = async (data, adminId) => {
  const fail = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  };
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail("Les informations de l'utilisateur sont invalides.");
  }
  const requiredText = (value, label, maxLength) => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) fail(`${label} est obligatoire.`);
    if (text.length > maxLength) fail(`${label} ne peut pas dépasser ${maxLength} caractères.`);
    return text;
  };
  const optionalText = (value, label, maxLength) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || value.trim().length > maxLength) {
      fail(`${label} ne peut pas dépasser ${maxLength} caractères.`);
    }
    return value.trim() || null;
  };

  const firstName = requiredText(data.firstName, "Le prénom", 100);
  const lastName = requiredText(data.lastName, "Le nom", 100);
  const email = requiredText(data.email, "L'adresse e-mail", 150).toLowerCase();
  const password = typeof data.password === "string" ? data.password : "";
  const role = String(data.role || "").toUpperCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("Adresse e-mail invalide.");
  if (!["TEACHER", "STUDENT"].includes(role)) fail("Le rôle doit être enseignant ou étudiant.");
  if (password.length < 8 || password.length > 128) fail("Le mot de passe doit contenir entre 8 et 128 caractères.");

  let avatar = null;
  if (data.avatar !== undefined && data.avatar !== null && data.avatar !== "") {
    const match = typeof data.avatar === "string"
      ? data.avatar.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/)
      : null;
    if (!match) fail("La photo doit être une image PNG ou JPG valide.");
    const image = Buffer.from(match[2], "base64");
    const validPng = match[1] === "png" && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const validJpeg = match[1] === "jpeg" && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    if (!validPng && !validJpeg) fail("Le contenu de la photo est invalide.");
    if (image.length > 2 * 1024 * 1024) fail("La photo ne doit pas dépasser 2 Mo.");
    avatar = data.avatar;
  }

  const profile = { firstName, lastName, email, password, role, avatar, isActive: true };
  const tenant = require("../utils/tenant-context").tenantContext.getStore();
  if (tenant?.isSuperAdmin) {
    fail("La création des comptes étudiants et enseignants doit être effectuée par un administrateur d'établissement.", 403);
  }
  if (role === "STUDENT") {
    profile.matricule = requiredText(data.matricule, "Le matricule", 80);
    profile.phone = requiredText(data.phone, "Le téléphone", 30);
    const classId = Number(data.academicClassId);
    if (!Number.isInteger(classId) || classId < 1) fail("La classe de l'étudiant est obligatoire.");
    const academicClass = await AcademicClass.findOne({
      where: { id: classId },
      include: [
        { model: AcademicYear, as: "academicYear", where: { isActive: true } },
        { model: AcademicProgram, as: "program", where: { isActive: true } },
        { model: AcademicLevel, as: "level", where: { isActive: true } },
      ],
    });
    if (!academicClass) fail("La classe sélectionnée n'appartient pas à l'année universitaire active.");
    profile.academicClassId = academicClass.id;
    profile.program = academicClass.program.name;
    profile.level = academicClass.level.name;
    profile.studentProfileCompleted = true;
  } else {
    profile.specialty = optionalText(data.specialty, "La spécialité", 150);
    profile.classesHeld = optionalText(data.classesHeld, "Les classes enseignées", 255);
    profile.university = optionalText(data.university, "L'établissement", 180);
    profile.academicTitle = optionalText(data.academicTitle, "Le titre académique", 120);
    profile.bio = optionalText(data.bio, "La biographie", 5000);
  }

  if (await User.findOne({ where: { email } })) fail("Cette adresse e-mail est déjà utilisée.", 409);
  if (profile.matricule && await User.findOne({ where: { matricule: profile.matricule } })) {
    fail("Ce matricule est déjà utilisé.", 409);
  }

  let createdUser;
  try {
    createdUser = await sequelize.transaction(async (transaction) => {
      const user = await User.create({
        ...profile,
        password: await bcrypt.hash(password, 12),
      }, { transaction });
      await sendUserCreatedEmail({ email, firstName, password, role });
      return user;
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      fail("Cette adresse e-mail ou ce matricule est déjà utilisé.", 409);
    }
    throw error;
  }

  await logAudit(adminId, "CREATE_USER", `Compte ${role === "TEACHER" ? "enseignant" : "étudiant"} créé pour ${email}`, createdUser.id, {
    status: "SUCCESS",
  });
  return getUserById(createdUser.id);
};

const updateUserByAdmin = async (userId, data, adminId) => {
  const user = await User.findByPk(userId);
  if (!user) { const error = new Error("Utilisateur introuvable"); error.statusCode = 404; throw error; }
  const changes = {};
  for (const key of ["firstName", "lastName", "email", "role", "isActive", "matricule", "level", "program", "phone", "studentProfileCompleted"]) if (data[key] !== undefined) changes[key] = data[key];
  if (changes.role) changes.role = String(changes.role).toUpperCase();
  if (changes.role && !["ADMIN", "TEACHER", "STUDENT"].includes(changes.role)) { const error = new Error("Rôle invalide"); error.statusCode = 400; throw error; }
  const targetRole = changes.role || user.role;
  const isSelf = Number(userId) === Number(adminId);
  if (isSelf && user.role === "ADMIN" && (targetRole !== "ADMIN" || changes.isActive === false)) {
    const error = new Error("Vous ne pouvez pas désactiver ou rétrograder votre propre compte administrateur");
    error.statusCode = 400;
    throw error;
  }
  const removesActiveAdmin = user.role === "ADMIN" && user.isActive && (targetRole !== "ADMIN" || changes.isActive === false);
  if (removesActiveAdmin && await User.count({ where: { role: "ADMIN", isActive: true } }) <= 1) {
    const error = new Error("Impossible de désactiver ou rétrograder le dernier administrateur actif");
    error.statusCode = 400;
    throw error;
  }
  if (targetRole === "STUDENT" && data.academicClassId !== undefined) {
    if (data.academicClassId === null || data.academicClassId === "") {
      changes.academicClassId = null;
      changes.level = null;
      changes.program = null;
    } else {
      const classId = Number(data.academicClassId);
      if (!Number.isInteger(classId) || classId < 1) { const error = new Error("La classe sélectionnée est invalide"); error.statusCode = 400; throw error; }
      const academicClass = await AcademicClass.findOne({
        where: { id: classId },
        include: [
          { model: AcademicYear, as: "academicYear", where: { isActive: true } },
          { model: AcademicProgram, as: "program", where: { isActive: true } },
          { model: AcademicLevel, as: "level", where: { isActive: true } },
        ],
      });
      if (!academicClass) { const error = new Error("La classe sélectionnée n'appartient pas à l'année universitaire active"); error.statusCode = 400; throw error; }
      changes.academicClassId = academicClass.id;
      changes.level = academicClass.level.name;
      changes.program = academicClass.program.name;
    }
  } else if (targetRole !== "STUDENT" && user.role === "STUDENT") {
    changes.academicClassId = null;
  }
  if (targetRole === "STUDENT") {
    const valueAfterUpdate = (key) => Object.prototype.hasOwnProperty.call(changes, key) ? changes[key] : user[key];
    const completed = ["matricule", "level", "program", "phone", "academicClassId"].every((key) => String(valueAfterUpdate(key) || "").trim());
    changes.studentProfileCompleted = completed;
  }
  if (changes.email && changes.email !== user.email && await User.findOne({ where: { email: changes.email } })) { const error = new Error("Cette adresse email est déjà utilisée"); error.statusCode = 409; throw error; }
  const roleChanged = targetRole !== user.role;
  const deactivated = user.isActive && changes.isActive === false;
  await user.update(changes);
  if (roleChanged || deactivated) {
    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null } }
    );
  }
  await logAudit(adminId, "UPDATE_USER", `Utilisateur ${user.email} modifié`, user.id, { status: "SUCCESS" });
  return getOwnProfile(user.id);
};

const deleteUserByAdmin = async (userId, adminId) => {
  if (Number(userId) === Number(adminId)) {
    const error = new Error("Vous ne pouvez pas supprimer votre propre compte");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }
  if (user.role === "ADMIN" && user.isActive && await User.count({ where: { role: "ADMIN", isActive: true } }) <= 1) {
    const error = new Error("Impossible de supprimer le dernier administrateur actif");
    error.statusCode = 400;
    throw error;
  }

  const email = user.email;

  const transaction = await sequelize.transaction();

  try {
    const announcementIds = (
      await Announcement.findAll({
        where: { createdBy: userId },
        attributes: ["id"],
        raw: true,
        transaction,
      })
    ).map((item) => item.id);

    if (announcementIds.length) {
      await AnnouncementAttachment.destroy({ where: { announcementId: announcementIds }, transaction });
    }

    await Message.destroy({ where: { [Op.or]: [{ senderId: userId }, { recipientId: userId }] }, transaction });
    await CourseStudent.destroy({ where: { studentId: userId }, transaction });
    await DocumentHistory.destroy({ where: { userId }, transaction });
    await Document.destroy({ where: { uploadedBy: userId }, transaction });
    await ExamResult.destroy({ where: { studentId: userId }, transaction });
    await ExamAttempt.destroy({ where: { studentId: userId }, transaction });
    await Announcement.destroy({ where: { createdBy: userId }, transaction });
    await Session.destroy({ where: { userId }, transaction });
    await UserRequest.destroy({ where: { userId }, transaction });
    await Audit.destroy({ where: { userId }, transaction });

    await user.destroy({ transaction });
    await logAudit(adminId, "DELETE_USER", `Utilisateur ${email} supprimé`, userId, { status: "SUCCESS" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const inviteUserByAdmin = async ({ email, role }, adminId) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedRole = String(role || "STUDENT").toUpperCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { const error = new Error("Adresse e-mail invalide"); error.statusCode = 400; throw error; }
  if (!["TEACHER", "STUDENT"].includes(normalizedRole)) { const error = new Error("Une invitation doit être envoyée à un enseignant ou un étudiant"); error.statusCode = 400; throw error; }
  if (await User.findOne({ where: { email: normalizedEmail } })) { const error = new Error("Cette adresse e-mail est déjà utilisée"); error.statusCode = 409; throw error; }
  const result = await sendInvitationEmail({ email: normalizedEmail, role: normalizedRole });
  await logAudit(adminId, "INVITE_USER", `Invitation envoyée à ${normalizedEmail}`, null, { status: "SUCCESS", metadata: { role: normalizedRole } });
  return { email: normalizedEmail, role: normalizedRole, ...result };
};

// =====================================================
// GET ADMIN STATS
// =====================================================

const getAdminStats = async (requestingUser = {}) => {
  try {
    if (requestingUser.isSuperAdmin) {
      const approvedAdminIds = await getApprovedAdminUserIds();
      const approvedAdmins = approvedAdminIds.length
        ? await User.findAll({
            where: { id: { [Op.in]: approvedAdminIds } },
            attributes: ["createdAt"],
            raw: true,
          })
        : [];
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      startDate.setMonth(startDate.getMonth() - 5);
      const monthlyUsers = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + index);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return {
          label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", ""),
          value: approvedAdmins.filter((user) => {
            const createdAt = new Date(user.createdAt);
            return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}` === key;
          }).length,
        };
      });

      return {
        totalUsers: approvedAdmins.length,
        teachers: 0,
        students: 0,
        admins: approvedAdmins.length,
        roles: [{ name: "Administrateurs", value: approvedAdmins.length }],
        monthlyUsers,
      };
    }

    const totalUsers = await User.count();
    const totalTeachers = await User.count({ where: { role: "TEACHER" } });
    const totalStudents = await User.count({ where: { role: "STUDENT" } });
    const totalAdmins = await User.count({ where: { role: "ADMIN" } });

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMonth(startDate.getMonth() - 5);

    const usersCreated = await User.findAll({
      attributes: ["createdAt"],
      where: { createdAt: { [Op.gte]: startDate } },
      raw: true,
    });
    const monthlyUsers = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", ""),
        value: usersCreated.filter((user) => {
          const createdAt = new Date(user.createdAt);
          return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}` === key;
        }).length,
      };
    });

    return {
      totalUsers,
      teachers: totalTeachers,
      students: totalStudents,
      admins: totalAdmins,
      roles: [
        { name: "Étudiants", value: totalStudents },
        { name: "Enseignants", value: totalTeachers },
        { name: "Administrateurs", value: totalAdmins },
      ],
      monthlyUsers,
    };
  } catch (error) {
    const err = new Error("Erreur lors de la récupération des statistiques");
    err.statusCode = 500;
    throw err;
  }
};


// =====================================================
// PENDING USER REQUESTS - VALIDATION DES NOUVEAUX UTILISATEURS
// =====================================================

const getPendingUserRequests = async (filters = {}, limit = 20, offset = 0) => {
  try {
    const where = { status: "PENDING", requestedRole: { [Op.ne]: "ADMIN" } };

    if (filters.requestedRole) {
      where.requestedRole = filters.requestedRole;
    }

    const { count, rows } = await UserRequest.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      total: count,
      data: rows,
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    const err = new Error("Erreur lors de la récupération des demandes en attente");
    err.statusCode = 500;
    throw err;
  }
};

const normalizeTeacherNotification = (notification, teacherId) => {
  const metadata = notification.metadata && typeof notification.metadata === "object" ? notification.metadata : {};
  const readBy = Array.isArray(metadata.readBy) ? metadata.readBy : [];

  return {
    ...notification.toJSON(),
    isRead: readBy.includes(teacherId),
    unread: !readBy.includes(teacherId),
  };
};

const getTeacherNotifications = async (teacherId, limit = 8, offset = 0) => {
  try {
    const where = {
      [Op.or]: [{ userId: teacherId }, { targetUserId: teacherId }],
    };

    const { count, rows } = await Audit.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const data = rows.map((row) => normalizeTeacherNotification(row, teacherId));

    return {
      total: count,
      data,
      unreadCount: data.filter((item) => !item.isRead).length,
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    const err = new Error("Erreur lors de la récupération des notifications enseignant");
    err.statusCode = 500;
    throw err;
  }
};

const markTeacherNotificationAsRead = async (teacherId, notificationId) => {
  try {
    const notification = await Audit.findByPk(notificationId);

    if (!notification) {
      const error = new Error("Notification introuvable");
      error.statusCode = 404;
      throw error;
    }

    if (notification.userId !== teacherId && notification.targetUserId !== teacherId) {
      const error = new Error("Vous n'êtes pas autorisé à marquer cette notification comme lue");
      error.statusCode = 403;
      throw error;
    }

    const metadata = notification.metadata && typeof notification.metadata === "object" ? notification.metadata : {};
    const readBy = Array.isArray(metadata.readBy) ? metadata.readBy : [];
    const nextReadBy = Array.from(new Set([...readBy, teacherId]));

    notification.metadata = {
      ...metadata,
      readBy: nextReadBy,
      readAt: new Date().toISOString(),
    };

    await notification.save();
    return normalizeTeacherNotification(notification, teacherId);
  } catch (error) {
    throw error;
  }
};

const markAllTeacherNotificationsAsRead = async (teacherId) => {
  try {
    const notifications = await Audit.findAll({
      where: {
        [Op.or]: [{ userId: teacherId }, { targetUserId: teacherId }],
      },
    });

    await Promise.all(
      notifications.map(async (notification) => {
        const metadata = notification.metadata && typeof notification.metadata === "object" ? notification.metadata : {};
        const readBy = Array.isArray(metadata.readBy) ? metadata.readBy : [];
        const nextReadBy = Array.from(new Set([...readBy, teacherId]));

        notification.metadata = {
          ...metadata,
          readBy: nextReadBy,
          readAt: new Date().toISOString(),
        };

        await notification.save();
      })
    );

    return { updatedCount: notifications.length };
  } catch (error) {
    throw error;
  }
};

const getStudentNotifications = async (studentId, limit = 8, offset = 0) => {
  const { count, rows } = await Audit.findAndCountAll({
    where: { targetUserId: studentId, action: "EXAM_ABSENCE" },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  const data = rows.map((row) => normalizeTeacherNotification(row, studentId));
  return { total: count, data, unreadCount: data.filter((item) => !item.isRead).length, page: Math.floor(offset / limit) + 1, perPage: limit, totalPages: Math.ceil(count / limit) };
};

const markStudentNotificationAsRead = async (studentId, notificationId) => {
  const notification = await Audit.findOne({ where: { id: notificationId, targetUserId: studentId, action: "EXAM_ABSENCE" } });
  if (!notification) { const error = new Error("Notification introuvable"); error.statusCode = 404; throw error; }
  const metadata = notification.metadata && typeof notification.metadata === "object" ? notification.metadata : {};
  notification.metadata = { ...metadata, readBy: Array.from(new Set([...(Array.isArray(metadata.readBy) ? metadata.readBy : []), studentId])), readAt: new Date().toISOString() };
  await notification.save();
  return normalizeTeacherNotification(notification, studentId);
};

const markAllStudentNotificationsAsRead = async (studentId) => {
  const notifications = await Audit.findAll({ where: { targetUserId: studentId, action: "EXAM_ABSENCE" } });
  await Promise.all(notifications.map((notification) => markStudentNotificationAsRead(studentId, notification.id)));
  return { updatedCount: notifications.length };
};


const approveUserRequest = async (requestId, adminId, reason = "") => {
  try {
    const userRequest = await UserRequest.findByPk(requestId);

    if (!userRequest) {
      const error = new Error("Demande non trouvée");
      error.statusCode = 404;
      throw error;
    }

    if (userRequest.status !== "PENDING") {
      const error = new Error("Cette demande a déjà été traitée");
      error.statusCode = 400;
      throw error;
    }
    if (userRequest.requestedRole === "ADMIN") {
      const error = new Error("Les demandes de compte administrateur doivent être validées par le super-administrateur.");
      error.statusCode = 403;
      throw error;
    }

    // Mettre à jour le rôle de l'utilisateur et l'activer
    const user = await User.findByPk(userRequest.userId);
    if (user) {
      await user.update({
        role: userRequest.requestedRole,
        isActive: true,
      });
    }

    // Mettre à jour la demande
    await userRequest.update({
      status: "APPROVED",
      approvedBy: adminId,
      approvalReason: reason,
      approvedAt: new Date(),
    });

    // Enregistrer l'audit
    await logAudit(
      adminId,
      "APPROVE_USER_REQUEST",
      `Demande d'inscription approuvée pour ${userRequest.email} (rôle: ${userRequest.requestedRole})`,
      userRequest.userId,
      { status: "SUCCESS" }
    );

    return userRequest;
  } catch (error) {
    throw error;
  }
};


const rejectUserRequest = async (requestId, adminId, reason = "") => {
  try {
    const userRequest = await UserRequest.findByPk(requestId);

    if (!userRequest) {
      const error = new Error("Demande non trouvée");
      error.statusCode = 404;
      throw error;
    }

    if (userRequest.status !== "PENDING") {
      const error = new Error("Cette demande a déjà été traitée");
      error.statusCode = 400;
      throw error;
    }
    if (userRequest.requestedRole === "ADMIN") {
      const error = new Error("Les demandes de compte administrateur doivent être traitées par le super-administrateur.");
      error.statusCode = 403;
      throw error;
    }

    // Mettre à jour la demande
    await userRequest.update({
      status: "REJECTED",
      approvedBy: adminId,
      approvalReason: reason,
      approvedAt: new Date(),
    });

    // Enregistrer l'audit
    await logAudit(
      adminId,
      "REJECT_USER_REQUEST",
      `Demande d'inscription rejetée pour ${userRequest.email} (rôle demandé: ${userRequest.requestedRole})`,
      userRequest.userId,
      { status: "SUCCESS" }
    );

    return userRequest;
  } catch (error) {
    throw error;
  }
};

const getPendingAdminRequests = async (limit = 20, offset = 0) => {
  const { count, rows } = await UserRequest.findAndCountAll({
    where: { status: "PENDING", requestedRole: "ADMIN" },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
  const data = await Promise.all(rows.map(async (request) => ({
    ...request.toJSON(),
    organization: request.organizationId
      ? await Organization.findByPk(request.organizationId, { attributes: ["id", "name"] })
      : null,
  })));
  return {
    total: count,
    data,
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
    totalPages: Math.ceil(count / limit),
  };
};

const decideAdminRequest = async (requestId, adminId, approve, reason = "") => {
  const request = await UserRequest.findOne({
    where: { id: requestId, requestedRole: "ADMIN", status: "PENDING" },
  });
  if (!request) {
    const error = new Error("Demande de compte administrateur introuvable ou déjà traitée.");
    error.statusCode = 404;
    throw error;
  }
  const user = await User.findByPk(request.userId);
  if (!user || !request.organizationId) {
    const error = new Error("Le compte ou l'établissement associé à cette demande est introuvable.");
    error.statusCode = 409;
    throw error;
  }
  const status = approve ? "APPROVED" : "REJECTED";
  await sequelize.transaction(async (transaction) => {
    if (approve) {
      await user.update({ role: "ADMIN", isActive: true }, { transaction });
    }
    await request.update({
      status,
      approvedBy: adminId,
      approvalReason: reason.trim() || null,
      approvedAt: new Date(),
    }, { transaction });
  });
  await logAudit(adminId, approve ? "APPROVE_ADMIN_REQUEST" : "REJECT_ADMIN_REQUEST",
    `${approve ? "Demande d'administrateur approuvée" : "Demande d'administrateur rejetée"} pour ${request.email}`,
    user.id, { status: "SUCCESS" });
  return { ...request.toJSON(), status, organizationId: request.organizationId };
};

const getSuperAdminOrganizations = async () => Organization.findAll({
  attributes: ["id", "name", "isLegacy"],
  order: [["name", "ASC"]],
});

const transferLegacyOrganization = async (targetOrganizationId, adminId) => {
  const targetId = Number(targetOrganizationId);
  if (!Number.isInteger(targetId) || targetId < 1) {
    const error = new Error("Choisissez un établissement valide.");
    error.statusCode = 400;
    throw error;
  }
  const [legacy, target] = await Promise.all([
    Organization.findOne({ where: { isLegacy: true } }),
    Organization.findByPk(targetId),
  ]);
  if (!legacy || !target || target.isLegacy || legacy.id === target.id) {
    const error = new Error("L'établissement historique ou la destination est invalide.");
    error.statusCode = 400;
    throw error;
  }

  const movedCounts = {};
  await sequelize.transaction(async (transaction) => {
    for (const name of require("../utils/tenant-context").tenantModelNames) {
      const model = models[name];
      const [updatedCount] = await model.update(
        { organizationId: target.id },
        { where: { organizationId: legacy.id }, transaction },
      );
      movedCounts[name] = updatedCount;
    }
  });
  await logAudit(adminId, "TRANSFER_LEGACY_ORGANIZATION",
    `Données historiques rattachées à l'établissement ${target.name}`,
    null,
    { status: "SUCCESS", metadata: { sourceOrganizationId: legacy.id, targetOrganizationId: target.id, movedCounts } });
  return { source: legacy.name, target: target.name, movedCounts };
};


// =====================================================
// AUDIT LOGS - CONSULTATION DES ACTIONS
// =====================================================

const getAuditLogsService = async (filters = {}, limit = 50, offset = 0) => {
  try {
    const { approvedAdminsOnly, ...auditFilters } = filters;
    if (approvedAdminsOnly) {
      auditFilters.relevantUserIds = await getApprovedAdminUserIds();
    }
    return await getAuditLogs(auditFilters, limit, offset);
  } catch (error) {
    const err = new Error("Erreur lors de la récupération des logs d'audit");
    err.statusCode = 500;
    throw err;
  }
};


const getUserActivityLogs = async (userId, limit = 30, offset = 0) => {
  try {
    return await getAuditLogs({ userId }, limit, offset);
  } catch (error) {
    const err = new Error("Erreur lors de la récupération de l'activité de l'utilisateur");
    err.statusCode = 500;
    throw err;
  }
};


const exportAuditLogs = async (filters = {}) => {
  const { approvedAdminsOnly, ...auditFilters } = filters;
  if (approvedAdminsOnly) {
    auditFilters.relevantUserIds = await getApprovedAdminUserIds();
  }
  return getAuditLogs(auditFilters, 10000, 0);
};

// =====================================================
// EXPORT
// =====================================================

const generateAdminReport = async () => {
  const [totalUsers, totalTeachers, totalStudents, totalAdmins, totalCourses, totalExams, publishedExams, activeUsers, pendingRequests, recentAudit] = await Promise.all([
    User.count(),
    User.count({ where: { role: "TEACHER" } }),
    User.count({ where: { role: "STUDENT" } }),
    User.count({ where: { role: "ADMIN" } }),
    Course.count(),
    Exam.count(),
    Exam.count({ where: { status: "PUBLISHED" } }),
    User.count({ where: { isActive: true } }),
    UserRequest.count({ where: { status: "PENDING" } }),
    Audit.findAll({
      attributes: ["id", "action", "description", "status", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 8,
    }),
  ]);

  const report = buildAdminReportSummary({
    totalUsers,
    totalTeachers,
    totalStudents,
    totalAdmins,
    totalCourses,
    totalExams,
    publishedExams,
    activeUsers,
    pendingRequests,
    recentAudit: recentAudit.map((item) => item.toJSON()),
  });

  report.recommendations = buildAdminReportRecommendations(report.summary);
  report.executiveSummary = {
    text: `La plateforme compte ${report.summary.totalUsers} utilisateur(s), dont ${report.summary.activeUsers} actif(s), avec ${report.summary.pendingRequests} demande(s) en attente. Le score de santé est de ${report.summary.healthScore}/100.`,
    source: "rules",
    generatedAt: new Date().toISOString(),
  };

  try {
    const text = await askAdminReportAssistant(report);
    if (typeof text === "string" && text.trim()) {
      report.executiveSummary = {
        text: text.trim(),
        source: "ai",
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn("Résumé exécutif IA indisponible, utilisation du résumé local:", error.message);
  }

  return report;
};

module.exports = {

  register,

  login,

  refresh,

  logout,

  getOwnProfile,

  updateOwnProfile,

  changeOwnPassword,

  updateOwnAvatar,

  getAllUsers,

  getStudentsForTeacher,

  getUserById,

  createUserByAdmin,

  updateUserByAdmin,

  deleteUserByAdmin,

  inviteUserByAdmin,

  getAdminStats,

  getSessions,

  revokeSession,

  logoutAll,

  getPendingUserRequests,
  getPendingAdminRequests,
  decideAdminRequest,
  getSuperAdminOrganizations,
  transferLegacyOrganization,
  getTeacherNotifications,
  markTeacherNotificationAsRead,
  markAllTeacherNotificationsAsRead,
  getStudentNotifications,
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,

  approveUserRequest,

  rejectUserRequest,

  getAuditLogsService,

  exportAuditLogs,

  getUserActivityLogs,

  generateAdminReport,
  buildAdminReportSummary,
  buildAdminReportRecommendations,

  logAudit,

};
