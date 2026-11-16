const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const announcementController = require("../controllers/announcement.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads/announcements");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, uploadDir),
		filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || "")}`),
	}),
	fileFilter: (_req, file, callback) => {
		const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/png", "image/jpeg", "image/webp"];
		callback(null, allowed.includes(file.mimetype));
	},
	limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

router.use(authenticate);
router.get("/", announcementController.getAnnouncements);
router.post("/", authorize("ADMIN"), upload.array("attachments", 5), announcementController.createAnnouncement);
router.delete("/:announcementId", authorize("ADMIN"), announcementController.deleteAnnouncement);
router.get("/attachments/:attachmentId/download", announcementController.downloadAttachment);

module.exports = router;
