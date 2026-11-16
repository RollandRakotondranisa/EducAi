const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const aiController = require("../controllers/ai.controller");

const router = express.Router();

router.post("/chat", authenticate, authorize("TEACHER", "STUDENT", "ADMIN"), aiController.chat);
router.post("/admin/chat", authenticate, authorize("ADMIN"), aiController.adminChat);
router.post("/courses/:courseId/chat", authenticate, authorize("STUDENT"), aiController.studentCourseChat);
router.post("/documents/:documentId/chat", authenticate, authorize("TEACHER"), aiController.documentChat);

module.exports = router;