const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const messageController = require("../controllers/message.controller");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads/messages");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

router.get("/recipients", messageController.getRecipients);
router.get("/inbox", messageController.getInbox);
router.get("/sent", messageController.getSent);
router.post("/", upload.array("attachments", 5), messageController.sendMessage);
router.patch("/:messageId/read", messageController.markAsRead);
router.get("/attachments/:attachmentId/download", messageController.downloadAttachment);

module.exports = router;
