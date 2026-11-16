const { Op } = require("sequelize");
const { Announcement, User, AnnouncementAttachment } = require("../models");

const TARGET_ROLES = ["STUDENT", "TEACHER", "ALL"];

const normalizeAnnouncement = (announcement) => {
  const data = announcement.toJSON ? announcement.toJSON() : announcement;
  return {
    ...data,
    attachments: Array.isArray(data.attachments)
      ? data.attachments.map((attachment) => ({
          id: attachment.id,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          kind: attachment.kind,
        }))
      : [],
    author: data.author
      ? {
          id: data.author.id,
          firstName: data.author.firstName,
          lastName: data.author.lastName,
          fullName: `${data.author.firstName || ""} ${data.author.lastName || ""}`.trim(),
        }
      : null,
  };
};

const validateAnnouncementInput = ({ title, content, targetRole, isSuperAdmin = false }) => {
  const safeTitle = String(title || "").trim();
  const safeContent = String(content || "").trim();
  const safeTargetRole = String(targetRole || "").toUpperCase();

  if (safeTitle.length < 3) {
    const error = new Error("Le titre de l'annonce est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (safeContent.length < 3) {
    const error = new Error("Le contenu de l'annonce est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  const allowedTargets = isSuperAdmin ? ["ADMIN"] : TARGET_ROLES;
  if (!allowedTargets.includes(safeTargetRole)) {
    const error = new Error("La cible de l'annonce est invalide");
    error.statusCode = 400;
    throw error;
  }

  return { safeTitle, safeContent, safeTargetRole };
};

const getAnnouncementsForUser = async (user) => {
  const role = String(user.role || "").toUpperCase();
  const now = new Date();
  const where = {
    [Op.or]: [{ targetRole: role }, { targetRole: "ALL" }],
    [Op.and]: [{ [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }] }],
  };

  const announcements = await Announcement.findAll({
    where,
    include: [
      { model: User, as: "author", attributes: ["id", "firstName", "lastName"] },
      { model: AnnouncementAttachment, as: "attachments" },
    ],
    order: [["publishedAt", "DESC"]],
    limit: 20,
  });

  return announcements.map(normalizeAnnouncement);
};

const getAllAnnouncements = async () => {
  const announcements = await Announcement.findAll({
    include: [
      { model: User, as: "author", attributes: ["id", "firstName", "lastName"] },
      { model: AnnouncementAttachment, as: "attachments" },
    ],
    order: [["publishedAt", "DESC"]],
    limit: 100,
  });
  return announcements.map(normalizeAnnouncement);
};

const createAnnouncement = async ({ adminId, isSuperAdmin, title, content, targetRole, expiresAt, attachments = [] }) => {
  const { safeTitle, safeContent, safeTargetRole } = validateAnnouncementInput({ title, content, targetRole, isSuperAdmin });
  const announcement = await Announcement.create({
    title: safeTitle,
    content: safeContent,
    targetRole: safeTargetRole,
    createdBy: adminId,
    expiresAt: expiresAt || null,
  });

  if (Array.isArray(attachments) && attachments.length) {
    await AnnouncementAttachment.bulkCreate(
      attachments.map((attachment) => ({
        announcementId: announcement.id,
        originalName: attachment.originalname || attachment.filename || "piece-jointe",
        storedName: attachment.filename || attachment.originalname || "piece-jointe",
        mimeType: attachment.mimetype || "application/octet-stream",
        filePath: attachment.path,
        fileSize: attachment.size || 0,
        kind: /^image\//.test(attachment.mimetype || "") ? "IMAGE" : "FILE",
      }))
    );
  }

  return normalizeAnnouncement(
    await Announcement.findByPk(announcement.id, {
      include: [
        { model: User, as: "author", attributes: ["id", "firstName", "lastName"] },
        { model: AnnouncementAttachment, as: "attachments" },
      ],
    })
  );
};

const getAttachmentForDownload = async (attachmentId, user) => {
  const attachment = await AnnouncementAttachment.findByPk(attachmentId, {
    include: [{ model: Announcement, as: "announcement" }],
  });

  if (!attachment) {
    const error = new Error("Pièce jointe introuvable");
    error.statusCode = 404;
    throw error;
  }

  const role = String(user.role || "").toUpperCase();
  const targetRole = attachment.announcement.targetRole;
  if (role !== "ADMIN" && targetRole !== "ALL" && targetRole !== role) {
    const error = new Error("Vous n'êtes pas autorisé à télécharger cette pièce jointe");
    error.statusCode = 403;
    throw error;
  }

  return attachment;
};

const deleteAnnouncement = async (announcementId) => {
  const announcement = await Announcement.findByPk(announcementId);
  if (!announcement) {
    const error = new Error("Annonce introuvable");
    error.statusCode = 404;
    throw error;
  }
  await announcement.destroy();
  return { id: announcementId };
};

module.exports = {
  TARGET_ROLES,
  validateAnnouncementInput,
  getAnnouncementsForUser,
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAttachmentForDownload,
};
