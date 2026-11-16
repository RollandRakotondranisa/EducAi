const fs = require("fs");
const announcementService = require("../services/announcement.service");

const getAnnouncements = async (req, res, next) => {
  try {
    const data = req.user.role === "ADMIN"
      ? await announcementService.getAllAnnouncements()
      : await announcementService.getAnnouncementsForUser(req.user);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.createAnnouncement({
      adminId: req.user.id,
      isSuperAdmin: Boolean(req.user.isSuperAdmin),
      title: req.body.title,
      content: req.body.content,
      targetRole: req.body.targetRole,
      expiresAt: req.body.expiresAt,
      attachments: req.files || [],
    });
    return res.status(201).json({ success: true, message: "Annonce publiée", data });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const data = await announcementService.deleteAnnouncement(Number(req.params.announcementId));
    return res.status(200).json({ success: true, message: "Annonce supprimée", data });
  } catch (error) {
    next(error);
  }
};

const downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await announcementService.getAttachmentForDownload(
      Number(req.params.attachmentId),
      req.user
    );
    if (!fs.existsSync(attachment.filePath)) {
      const error = new Error("Pièce jointe introuvable");
      error.statusCode = 404;
      throw error;
    }
    return res.download(attachment.filePath, attachment.originalName);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement, downloadAttachment };
