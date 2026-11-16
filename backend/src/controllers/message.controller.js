const path = require("path");
const fs = require("fs");
const messageService = require("../services/message.service");

const getRecipients = async (req, res, next) => {
  try {
    const data = await messageService.getAvailableRecipientsForUser(req.user.id);
    return res.status(200).json({
      success: true,
      message: "Destinataires récupérés avec succès",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getInbox = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));

    const data = await messageService.getInboxForUser(req.user.id, { search, page, limit });
    return res.status(200).json({
      success: true,
      message: "Messages reçus récupérés avec succès",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSent = async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));

    const data = await messageService.getSentMessagesForUser(req.user.id, { search, page, limit });
    return res.status(200).json({
      success: true,
      message: "Messages envoyés récupérés avec succès",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const data = await messageService.sendMessage({
      senderId: req.user.id,
      recipientId: Number(req.body.recipientId),
      title: req.body.title,
      content: req.body.content,
      attachments: req.files || [],
    });

    return res.status(201).json({
      success: true,
      message: "Message envoyé avec succès",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const data = await messageService.markMessageAsRead(Number(req.params.messageId), req.user.id);
    return res.status(200).json({
      success: true,
      message: "Message marqué comme lu",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const downloadAttachment = async (req, res, next) => {
  try {
    const data = await messageService.getAttachmentForDownload(Number(req.params.attachmentId), req.user.id);
    const filePath = data.filePath;
    if (!fs.existsSync(filePath)) {
      const error = new Error("Pièce jointe introuvable");
      error.statusCode = 404;
      throw error;
    }
    return res.download(filePath, data.originalName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecipients,
  getInbox,
  getSent,
  sendMessage,
  markAsRead,
  downloadAttachment,
};
