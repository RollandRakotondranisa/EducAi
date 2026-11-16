const authService = require("../services/auth.service");
const oauthService = require("../services/oauth.service");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

const OAUTH_COOKIE = "educai_oauth_state";

function readCookie(req, name) {
  return String(req.headers.cookie || "").split(";").map((item) => item.trim()).reduce((value, item) => {
    const separator = item.indexOf("=");
    return separator > 0 && item.slice(0, separator) === name ? decodeURIComponent(item.slice(separator + 1)) : value;
  }, "");
}

function oauthCookie(value, maxAge = 600) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${OAUTH_COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/api/auth/oauth; Max-Age=${maxAge}${secure}`;
}

const startOAuth = (req, res) => {
  try {
    const flow = req.query.flow === "register" ? "register" : "login";
    const statePayload = flow === "register"
      ? Buffer.from(JSON.stringify({
          role: String(req.query.role || "STUDENT").toUpperCase(),
          institutionName: String(req.query.institutionName || "").trim(),
        })).toString("base64url")
      : "";
    const state = `${flow}.${require("crypto").randomBytes(32).toString("hex")}${statePayload ? `.${statePayload}` : ""}`;
    res.setHeader("Set-Cookie", oauthCookie(state));
    return res.redirect(oauthService.authorizationUrl(req.params.provider, state));
  } catch (error) {
    return res.redirect(oauthService.loginUrl({ oauthError: error.message }));
  }
};

const completeOAuth = async (req, res) => {
  const expectedState = readCookie(req, OAUTH_COOKIE);
  const flow = expectedState.startsWith("register.") ? "register" : "login";
  try {
    if (!expectedState || !req.query.state || expectedState !== req.query.state) throw new Error("La validation de sécurité de la connexion a expiré. Réessayez.");
    if (req.query.error || !req.query.code) throw new Error(req.query.error === "access_denied" ? "Connexion annulée." : "La connexion a été refusée par le fournisseur.");
    let registration = {};
    if (flow === "register") {
      const encodedPayload = expectedState.split(".")[2];
      if (!encodedPayload) throw new Error("Indiquez votre rôle et votre établissement dans le formulaire d'inscription.");
      try {
        registration = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
      } catch {
        throw new Error("Les informations d'inscription sont invalides. Recommencez.");
      }
    }
    const result = await oauthService.loginWithOAuth(
      req.params.provider,
      req.query.code,
      req.get("user-agent"),
      req.ip,
      registration
    );
    res.setHeader("Set-Cookie", oauthCookie("", 0));
    return res.redirect(oauthService.loginUrl({ oauth: "success", user: JSON.stringify(result.user), accessToken: result.accessToken, refreshToken: result.refreshToken }));
  } catch (error) {
    res.setHeader("Set-Cookie", oauthCookie("", 0));
    if (flow === "register" && error.code === "ACCOUNT_PENDING") {
      return res.redirect(oauthService.loginUrl({ oauth: "pending", email: error.email || "" }, "inscription"));
    }
    return res.redirect(oauthService.loginUrl({ oauthError: error.message || "Connexion impossible." }));
  }
};


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// ME
// =====================================================

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Utilisateur authentifié",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// REFRESH TOKEN
// =====================================================

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result =
      await authService.refresh(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token renouvelé avec succès",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res, next) => {
  try {

    await authService.logout(
      req.user.id,
      req.user.sessionId
    );

    return res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });

  } catch (error) {
    next(error);
  }
};


const getOwnProfile = async (req, res, next) => {
  try { return res.json({ success: true, data: await authService.getOwnProfile(req.user.id) }); } catch (error) { next(error); }
};

const updateOwnProfile = async (req, res, next) => {
  try { return res.json({ success: true, message: "Profil mis à jour avec succès", data: await authService.updateOwnProfile(req.user.id, req.body) }); } catch (error) { next(error); }
};

const changeOwnPassword = async (req, res, next) => {
  try { await authService.changeOwnPassword(req.user.id, req.body.currentPassword, req.body.newPassword, req.user.sessionId); return res.json({ success: true, message: "Mot de passe mis à jour avec succès" }); } catch (error) { next(error); }
};

const updateOwnAvatar = async (req, res, next) => {
  try { return res.json({ success: true, message: "Photo de profil mise à jour avec succès", data: await authService.updateOwnAvatar(req.user.id, req.body.avatar) }); } catch (error) { next(error); }
};

// =====================================================
// GET ALL USERS (ADMIN)
// =====================================================

const getAllUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers(req.user);

    return res.status(200).json({
      success: true,
      message: "Utilisateurs récupérés avec succès",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentsForTeacher = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Étudiants récupérés avec succès",
      data: await authService.getStudentsForTeacher(req.user.id),
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherNotifications = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 0;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 8, 30);
    const offset = page * limit;

    const data = await authService.getTeacherNotifications(req.user.id, limit, offset);

    return res.status(200).json({
      success: true,
      message: "Notifications enseignant récupérées",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const markTeacherNotificationAsRead = async (req, res, next) => {
  try {
    const result = await authService.markTeacherNotificationAsRead(req.user.id, Number(req.params.notificationId));

    return res.status(200).json({
      success: true,
      message: "Notification marquée comme lue",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllTeacherNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await authService.markAllTeacherNotificationsAsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentNotifications = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 0;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 8, 30);
    return res.json({ success: true, message: "Notifications étudiant récupérées", data: await authService.getStudentNotifications(req.user.id, limit, page * limit) });
  } catch (error) { next(error); }
};

const markStudentNotificationAsRead = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await authService.markStudentNotificationAsRead(req.user.id, Number(req.params.notificationId)) });
  } catch (error) { next(error); }
};

const markAllStudentNotificationsAsRead = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await authService.markAllStudentNotificationsAsRead(req.user.id) });
  } catch (error) { next(error); }
};

const getUserById = async (req, res, next) => {
  try { return res.json({ success: true, data: await authService.getUserById(req.params.userId) }); } catch (error) { next(error); }
};

const createUserByAdmin = async (req, res, next) => {
  try {
    if (req.user.isSuperAdmin) {
      const error = new Error("Les comptes étudiants et enseignants sont créés par les administrateurs d'établissement.");
      error.statusCode = 403;
      throw error;
    }
    return res.status(201).json({ success: true, message: "Compte créé et e-mail de bienvenue envoyé", data: await authService.createUserByAdmin(req.body, req.user.id) });
  } catch (error) { next(error); }
};

const updateUserByAdmin = async (req, res, next) => {
  try { return res.json({ success: true, message: "Utilisateur modifié avec succès", data: await authService.updateUserByAdmin(req.params.userId, req.body, req.user.id) }); } catch (error) { next(error); }
};

const deleteUserByAdmin = async (req, res, next) => {
  try { await authService.deleteUserByAdmin(req.params.userId, req.user.id); return res.json({ success: true, message: "Utilisateur supprimé avec succès" }); } catch (error) { next(error); }
};

const inviteUserByAdmin = async (req, res, next) => {
  try { return res.status(201).json({ success: true, message: "Invitation envoyée avec succès", data: await authService.inviteUserByAdmin(req.body, req.user.id) }); } catch (error) { next(error); }
};

// =====================================================
// GET ADMIN STATS
// =====================================================

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await authService.getAdminStats(req.user);

    return res.status(200).json({
      success: true,
      message: "Statistiques récupérées avec succès",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// PENDING USER REQUESTS - VALIDATION DES NOUVEAUX UTILISATEURS
// =====================================================

const getPendingUserRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const offset = page * limit;

    const requests = await authService.getPendingUserRequests({}, limit, offset);

    return res.status(200).json({
      success: true,
      message: "Demandes en attente récupérées",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingAdminRequests = async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) {
      const error = new Error("Accès réservé au super-administrateur.");
      error.statusCode = 403;
      throw error;
    }
    const page = Math.max(0, Number.parseInt(req.query.page, 10) || 0);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    return res.json({
      success: true,
      data: await authService.getPendingAdminRequests(limit, page * limit),
    });
  } catch (error) {
    next(error);
  }
};

const decideAdminRequest = (approve) => async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) {
      const error = new Error("Accès réservé au super-administrateur.");
      error.statusCode = 403;
      throw error;
    }
    const data = await authService.decideAdminRequest(
      req.params.requestId,
      req.user.id,
      approve,
      String(req.body.reason || "")
    );
    return res.json({
      success: true,
      message: approve ? "Demande administrateur approuvée." : "Demande administrateur rejetée.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const approveAdminRequest = decideAdminRequest(true);
const rejectAdminRequest = decideAdminRequest(false);

const getSuperAdminOrganizations = async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) {
      const error = new Error("Accès réservé au super-administrateur.");
      error.statusCode = 403;
      throw error;
    }
    return res.json({ success: true, data: await authService.getSuperAdminOrganizations() });
  } catch (error) {
    next(error);
  }
};

const transferLegacyOrganization = async (req, res, next) => {
  try {
    if (!req.user.isSuperAdmin) {
      const error = new Error("Accès réservé au super-administrateur.");
      error.statusCode = 403;
      throw error;
    }
    const data = await authService.transferLegacyOrganization(req.body.organizationId, req.user.id);
    return res.json({ success: true, message: "Données historiques rattachées à l'établissement.", data });
  } catch (error) {
    next(error);
  }
};


const approveUserRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const result = await authService.approveUserRequest(requestId, adminId, reason || "");

    return res.status(200).json({
      success: true,
      message: "Demande approuvée avec succès",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


const rejectUserRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const result = await authService.rejectUserRequest(requestId, adminId, reason || "");

    return res.status(200).json({
      success: true,
      message: "Demande rejetée avec succès",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// AUDIT LOGS
// =====================================================

const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = page * limit;
    const filters = {
      action: req.query.action ? String(req.query.action).trim().toUpperCase() : undefined,
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      approvedAdminsOnly: Boolean(req.user.isSuperAdmin),
    };

    const logs = await authService.getAuditLogsService(filters, limit, offset);

    return res.status(200).json({
      success: true,
      message: "Logs d'audit récupérés",
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};


const exportAuditLogs = async (req, res, next) => {
  try {
    const filters = {
      action: req.query.action ? String(req.query.action).trim().toUpperCase() : undefined,
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      approvedAdminsOnly: Boolean(req.user.isSuperAdmin),
    };
    const { data } = await authService.exportAuditLogs(filters);
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [["Date", "Action", "Utilisateur ID", "Utilisateur cible ID", "Description", "Statut"], ...data.map((log) => [log.createdAt, log.action, log.userId, log.targetUserId, log.description, log.status])];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=journal-audit.csv");
    return res.send(`\uFEFF${rows.map((row) => row.map(escape).join(";")).join("\n")}`);
  } catch (error) { next(error); }
};

const getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 30;
    const offset = page * limit;

    const logs = await authService.getUserActivityLogs(userId, limit, offset);

    return res.status(200).json({
      success: true,
      message: "Activité de l'utilisateur récupérée",
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

const generateAdminReport = async (req, res, next) => {
  try {
    const report = await authService.generateAdminReport();
    return res.status(200).json({
      success: true,
      message: "Rapport IA admin généré avec succès",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const exportAdminReport = async (req, res, next) => {
  try {
    const type = String(req.query.type || "csv").toLowerCase();
    const report = await authService.generateAdminReport();

    if (type === "pdf") {
      const pdfBuffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (error) => reject(error));

        doc.fontSize(20).text("Rapport IA EduAI", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Date: ${report.summary.generatedAt}`);
        doc.moveDown();
        doc.fontSize(12).text(`Utilisateurs total: ${report.summary.totalUsers}`);
        doc.text(`Étudiants: ${report.summary.totalStudents}`);
        doc.text(`Enseignants: ${report.summary.totalTeachers}`);
        doc.text(`Administrateurs: ${report.summary.totalAdmins}`);
        doc.text(`Cours: ${report.summary.totalCourses}`);
        doc.text(`Examens publiés: ${report.summary.publishedExams}`);
        doc.text(`Demandes en attente: ${report.summary.pendingRequests}`);
        doc.text(`Score de santé: ${report.summary.healthScore}/100`);
        doc.moveDown();
        doc.fontSize(12).text("Résumé exécutif:");
        doc.fontSize(10).text(report.executiveSummary.text);
        doc.moveDown();
        doc.fontSize(12).text("Recommandations:");
        report.recommendations.forEach((item) => doc.fontSize(10).text(`[${item.priority.toUpperCase()}] ${item.title} - ${item.action}`));
        doc.moveDown();
        doc.fontSize(12).text("Insights:");
        report.insights.forEach((line) => doc.text(`- ${line}`));
        doc.end();
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=eduai-admin-report.pdf");
      return res.send(pdfBuffer);
    }

    if (type === "xlsx") {
      const workbook = XLSX.utils.book_new();
      const rows = [
        ["Catégorie", "Valeur"],
        ["Utilisateurs total", report.summary.totalUsers],
        ["Étudiants", report.summary.totalStudents],
        ["Enseignants", report.summary.totalTeachers],
        ["Administrateurs", report.summary.totalAdmins],
        ["Cours", report.summary.totalCourses],
        ["Examens", report.summary.totalExams],
        ["Examens publiés", report.summary.publishedExams],
        ["Utilisateurs actifs", report.summary.activeUsers],
        ["Demandes en attente", report.summary.pendingRequests],
        ["Score santé", `${report.summary.healthScore}/100`],
        ["Résumé exécutif", report.executiveSummary.text],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport");
      const executiveRows = [
        ["Résumé exécutif", report.executiveSummary.text],
        ["Source", report.executiveSummary.source],
        [],
        ["Priorité", "Recommandation", "Action", "Justification"],
        ...report.recommendations.map((item) => [item.priority, item.title, item.action, item.reason]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(executiveRows), "Synthèse IA");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=eduai-admin-report.xlsx");
      return res.send(buffer);
    }

    const rows = [
      ["Catégorie", "Valeur"],
      ["Utilisateurs total", report.summary.totalUsers],
      ["Étudiants", report.summary.totalStudents],
      ["Enseignants", report.summary.totalTeachers],
      ["Administrateurs", report.summary.totalAdmins],
      ["Cours", report.summary.totalCourses],
      ["Examens", report.summary.totalExams],
      ["Examens publiés", report.summary.publishedExams],
      ["Utilisateurs actifs", report.summary.activeUsers],
      ["Demandes en attente", report.summary.pendingRequests],
      ["Score santé", `${report.summary.healthScore}/100`],
      ["Résumé exécutif", report.executiveSummary.text],
      ["Recommandations", report.recommendations.map((item) => `${item.title}: ${item.action}`).join(" | ")],
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=eduai-admin-report.csv");
    return res.send(csv);
  } catch (error) { next(error); }
};

module.exports = {
  startOAuth,
  completeOAuth,
  register,
  login,
  getMe,
  refresh,
  logout,

  getOwnProfile,

  updateOwnProfile,

  changeOwnPassword,

  updateOwnAvatar,

  getAllUsers,

  getStudentsForTeacher,
  getTeacherNotifications,
  markTeacherNotificationAsRead,
  markAllTeacherNotificationsAsRead,
  getStudentNotifications,
  markStudentNotificationAsRead,
  markAllStudentNotificationsAsRead,

  getUserById,
  createUserByAdmin,
  updateUserByAdmin,

  deleteUserByAdmin,

  inviteUserByAdmin,
  getAdminStats,
  getPendingUserRequests,
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getSuperAdminOrganizations,
  transferLegacyOrganization,
  approveUserRequest,
  rejectUserRequest,
  getAuditLogs,

  exportAuditLogs,
  getUserActivityLogs,

  generateAdminReport,
  exportAdminReport,
};
