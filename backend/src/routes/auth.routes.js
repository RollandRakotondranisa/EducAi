const express = require("express");

const authController = require("../controllers/auth.controller");

const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");

const validate = require("../middleware/validation.middleware");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

// IMPORTANT : créer router AVANT router.get() / router.post()
const router = express.Router();

router.get("/oauth/:provider", authController.startOAuth);
router.get("/oauth/:provider/callback", authController.completeOAuth);


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);


// =====================================================
// ME - UTILISATEUR CONNECTÉ
// =====================================================

router.get(
  "/me",
  authenticate,
  authController.getMe
);


// =====================================================
// REFRESH TOKEN
// =====================================================

router.post(
  "/refresh",
  authController.refresh
);


// =====================================================
// LOGOUT
// =====================================================

router.post(
  "/logout",
  authenticate,
  authController.logout
);


// =====================================================
// ADMIN TEST
// =====================================================

router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Bienvenue administrateur",
      user: req.user,
    });
  }
);


// =====================================================
// GET ALL USERS (ADMIN ONLY)
// =====================================================

router.get(
  "/admin/users",
  authenticate,
  authorize("ADMIN"),
  authController.getAllUsers
);

router.get(
  "/teacher/students",
  authenticate,
  authorize("TEACHER"),
  authController.getStudentsForTeacher
);

router.get(
  "/teacher/notifications",
  authenticate,
  authorize("TEACHER"),
  authController.getTeacherNotifications
);

router.patch(
  "/teacher/notifications/:notificationId/read",
  authenticate,
  authorize("TEACHER"),
  authController.markTeacherNotificationAsRead
);

router.patch(
  "/teacher/notifications/read-all",
  authenticate,
  authorize("TEACHER"),
  authController.markAllTeacherNotificationsAsRead
);

router.get("/student/notifications", authenticate, authorize("STUDENT"), authController.getStudentNotifications);
router.patch("/student/notifications/:notificationId/read", authenticate, authorize("STUDENT"), authController.markStudentNotificationAsRead);
router.patch("/student/notifications/read-all", authenticate, authorize("STUDENT"), authController.markAllStudentNotificationsAsRead);

router.get("/profile", authenticate, authController.getOwnProfile);
router.put("/profile", authenticate, authController.updateOwnProfile);
router.put("/profile/password", authenticate, authController.changeOwnPassword);
router.put("/profile/avatar", authenticate, authController.updateOwnAvatar);

router.post("/admin/users/invite", authenticate, authorize("ADMIN"), authController.inviteUserByAdmin);
router.post("/admin/users", authenticate, authorize("ADMIN"), authController.createUserByAdmin);
router.get("/admin/users/:userId", authenticate, authorize("ADMIN"), authController.getUserById);
router.put("/admin/users/:userId", authenticate, authorize("ADMIN"), authController.updateUserByAdmin);
router.delete("/admin/users/:userId", authenticate, authorize("ADMIN"), authController.deleteUserByAdmin);


// =====================================================
// GET ADMIN STATS (ADMIN ONLY)
// =====================================================

router.get(
  "/admin/stats",
  authenticate,
  authorize("ADMIN"),
  authController.getAdminStats
);


// =====================================================
// PENDING USER REQUESTS (ADMIN ONLY)
// =====================================================

router.get(
  "/admin/pending-requests",
  authenticate,
  authorize("ADMIN"),
  authController.getPendingUserRequests
);

router.get(
  "/super-admin/pending-admin-requests",
  authenticate,
  authorize("ADMIN"),
  authController.getPendingAdminRequests
);

router.post(
  "/super-admin/approve-admin-request/:requestId",
  authenticate,
  authorize("ADMIN"),
  authController.approveAdminRequest
);

router.post(
  "/super-admin/reject-admin-request/:requestId",
  authenticate,
  authorize("ADMIN"),
  authController.rejectAdminRequest
);

router.get(
  "/super-admin/organizations",
  authenticate,
  authorize("ADMIN"),
  authController.getSuperAdminOrganizations
);

router.post(
  "/super-admin/transfer-legacy",
  authenticate,
  authorize("ADMIN"),
  authController.transferLegacyOrganization
);


router.post(
  "/admin/approve-request/:requestId",
  authenticate,
  authorize("ADMIN"),
  authController.approveUserRequest
);


router.post(
  "/admin/reject-request/:requestId",
  authenticate,
  authorize("ADMIN"),
  authController.rejectUserRequest
);


// =====================================================
// AUDIT LOGS (ADMIN ONLY)
// =====================================================

router.get(
  "/admin/audit-logs/export",
  authenticate,
  authorize("ADMIN"),
  authController.exportAuditLogs
);

router.get(
  "/admin/audit-logs",
  authenticate,
  authorize("ADMIN"),
  authController.getAuditLogs
);

router.get(
  "/admin/report",
  authenticate,
  authorize("ADMIN"),
  authController.generateAdminReport
);

router.get(
  "/admin/report/export",
  authenticate,
  authorize("ADMIN"),
  authController.exportAdminReport
);

router.get(
  "/admin/user-activity/:userId",
  authenticate,
  authorize("ADMIN"),
  authController.getUserActivityLogs
);


module.exports = router;
