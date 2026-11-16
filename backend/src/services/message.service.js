const { Op } = require("sequelize");
const { User, Message, MessageAttachment, CourseStudent, Course } = require("../models");
const { getApprovedAdminUserIds } = require("../utils/approved-admins");

const ROLE_RECIPIENTS = {
  STUDENT: ["TEACHER", "ADMIN", "STUDENT"],
  TEACHER: ["STUDENT", "ADMIN", "TEACHER"],
  ADMIN: ["TEACHER", "STUDENT", "ADMIN"],
};

const serializeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    email: user.email,
    avatar: user.avatar,
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  };
};

const serializeMessage = (message) => {
  const raw = message.toJSON ? message.toJSON() : message;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((attachment) => ({
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        kind: attachment.kind,
        filePath: attachment.filePath,
      }))
    : [];

  return {
    ...raw,
    sender: serializeUser(raw.sender),
    recipient: serializeUser(raw.recipient),
    attachments,
  };
};

const getRecipientOptionsForRole = (role, users = []) => {
  const normalizedRole = String(role || "").toUpperCase();
  const allowedRoles = new Set((ROLE_RECIPIENTS[normalizedRole] || []).map((item) => String(item).toUpperCase()));

  return users
    .filter((user) => allowedRoles.has(String(user.role || "").toUpperCase()))
    .map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }));
};

const getCourseIdsForUser = async (userId, role) => {
  if (role === "STUDENT") {
    const enrollments = await CourseStudent.findAll({
      where: { studentId: userId },
      attributes: ["courseId"],
      raw: true,
    });
    return [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
  }

  if (role === "TEACHER") {
    const courses = await Course.findAll({
      where: { teacherId: userId },
      attributes: ["id"],
      raw: true,
    });
    return courses.map((course) => course.id);
  }

  return [];
};

const getRelatedRecipientIds = async (userId, userRole, recipientRole) => {
  if (userRole === "ADMIN") return null;
  if (recipientRole === "ADMIN") return null;

  const courseIds = await getCourseIdsForUser(userId, userRole);
  if (!courseIds.length) return [];

  if (recipientRole === "STUDENT") {
    const students = await CourseStudent.findAll({
      where: { courseId: { [Op.in]: courseIds } },
      attributes: ["studentId"],
      raw: true,
    });
    return [...new Set(students.map((student) => student.studentId))];
  }

  if (recipientRole === "TEACHER") {
    const courses = await Course.findAll({
      where: { id: { [Op.in]: courseIds } },
      attributes: ["teacherId"],
      raw: true,
    });
    return [...new Set(courses.map((course) => course.teacherId))];
  }

  return [];
};

const isRelatedRecipient = async (senderId, senderRole, recipientId, recipientRole) => {
  if (senderRole === "ADMIN") return true;
  if (recipientRole === "ADMIN") return true;

  const relatedIds = await getRelatedRecipientIds(senderId, senderRole, recipientRole);
  return relatedIds?.includes(recipientId) || false;
};

const getAvailableRecipientsForUser = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "role", "isSuperAdmin"],
  });

  if (!user) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  const normalizedRole = String(user.role).toUpperCase();
  const allowedRoles = ROLE_RECIPIENTS[normalizedRole] || [];
  let recipientWhere;
  if (user.isSuperAdmin) {
    const approvedAdminIds = await getApprovedAdminUserIds({ activeOnly: true });
    recipientWhere = approvedAdminIds.length
      ? [{
          role: "ADMIN",
          isActive: true,
          isSuperAdmin: false,
          id: { [Op.in]: approvedAdminIds },
        }]
      : [];
  } else {
    const recipientIdsByRole = await Promise.all(
      allowedRoles.map(async (recipientRole) => ({
        role: recipientRole,
        ids: await getRelatedRecipientIds(userId, normalizedRole, recipientRole),
      }))
    );

    recipientWhere = recipientIdsByRole
      .map(({ role: recipientRole, ids }) => {
        if (ids === null) return { role: recipientRole };
        if (!ids.length) return null;
        return { role: recipientRole, id: { [Op.in]: ids } };
      })
      .filter(Boolean);
  }

  const recipients = recipientWhere.length
    ? await User.findAll({
        where: {
          [Op.or]: recipientWhere,
          id: { [Op.ne]: userId },
        },
        attributes: ["id", "firstName", "lastName", "role", "avatar", "email"],
        order: [["lastName", "ASC"], ["firstName", "ASC"]],
      })
    : [];

  return getRecipientOptionsForRole(user.role, recipients);
};

const getInboxForUser = async (userId, options = {}) => {
  const search = String(options.search || "").trim();
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(20, Math.max(1, Number(options.limit || 6)));
  const offset = (page - 1) * limit;

  const where = { recipientId: userId };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      { model: User, as: "sender", attributes: ["id", "firstName", "lastName", "role", "avatar", "email"] },      { model: MessageAttachment, as: "attachments" },    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
    data: rows.map((message) => serializeMessage(message)),
  };
};

const getSentMessagesForUser = async (userId, options = {}) => {
  const search = String(options.search || "").trim();
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(20, Math.max(1, Number(options.limit || 6)));
  const offset = (page - 1) * limit;

  const where = { senderId: userId };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [
      { model: User, as: "recipient", attributes: ["id", "firstName", "lastName", "role", "avatar", "email"] },      { model: MessageAttachment, as: "attachments" },    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    total: count,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(count / limit)),
    data: rows.map((message) => serializeMessage(message)),
  };
};

const sendMessage = async ({ senderId, recipientId, title, content, attachments = [] }) => {
  const sender = await User.findByPk(senderId, { attributes: ["id", "role", "isSuperAdmin", "firstName", "lastName", "email"] });
  if (!sender) {
    const error = new Error("Expéditeur introuvable");
    error.statusCode = 404;
    throw error;
  }

  const recipient = await User.findByPk(recipientId, {
    attributes: ["id", "role", "isActive", "isSuperAdmin", "firstName", "lastName", "email"],
  });

  if (!recipient) {
    const error = new Error("Destinataire introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (senderId === recipientId) {
    const error = new Error("Vous ne pouvez pas vous envoyer un message");
    error.statusCode = 400;
    throw error;
  }

  const senderRole = String(sender.role).toUpperCase();
  const recipientRole = String(recipient.role).toUpperCase();
  const allowedRoles = ROLE_RECIPIENTS[senderRole] || [];
  const isAllowedRole = allowedRoles.includes(recipientRole);
  const isAllowedRelation = sender.isSuperAdmin
    ? recipientRole === "ADMIN" &&
      recipient.isActive &&
      !recipient.isSuperAdmin &&
      (await getApprovedAdminUserIds({ activeOnly: true })).includes(Number(recipientId))
    : isAllowedRole
      ? await isRelatedRecipient(senderId, senderRole, recipientId, recipientRole)
      : false;

  if (!isAllowedRelation) {
    const error = new Error("Ce destinataire n'est pas autorisé pour votre rôle");
    error.statusCode = 400;
    throw error;
  }

  const safeTitle = String(title || "").trim();
  const safeContent = String(content || "").trim();

  if (!safeTitle || safeTitle.length < 3) {
    const error = new Error("Le titre du message est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  if (!safeContent || safeContent.length < 3) {
    const error = new Error("Le contenu du message est obligatoire");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.create({
    senderId,
    recipientId,
    title: safeTitle,
    content: safeContent,
    isRead: false,
  });

  if (Array.isArray(attachments) && attachments.length > 0) {
    await Promise.all(
      attachments.map(async (attachment) => {
        const kind = /^image\//.test(attachment.mimetype || "") ? "IMAGE" : "FILE";
        await MessageAttachment.create({
          messageId: message.id,
          originalName: attachment.originalname || attachment.filename || "piece-jointe",
          storedName: attachment.filename || attachment.originalname || "piece-jointe",
          mimeType: attachment.mimetype || "application/octet-stream",
          filePath: attachment.path,
          fileSize: attachment.size || 0,
          kind,
        });
      })
    );
  }

  const savedMessage = await Message.findByPk(message.id, {
    include: [
      { model: User, as: "sender", attributes: ["id", "firstName", "lastName", "role", "email", "avatar"] },
      { model: User, as: "recipient", attributes: ["id", "firstName", "lastName", "role", "email", "avatar"] },
      { model: MessageAttachment, as: "attachments" },
    ],
  });

  return serializeMessage(savedMessage);
};

const markMessageAsRead = async (messageId, userId) => {
  const message = await Message.findOne({
    where: {
      id: messageId,
      recipientId: userId,
    },
    include: [
      { model: User, as: "sender", attributes: ["id", "firstName", "lastName", "role", "email", "avatar"] },
      { model: User, as: "recipient", attributes: ["id", "firstName", "lastName", "role", "email", "avatar"] },
      { model: MessageAttachment, as: "attachments" },
    ],
  });

  if (!message) {
    const error = new Error("Message introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (!message.isRead) {
    await message.update({
      isRead: true,
      readAt: new Date(),
    });
  }

  return serializeMessage(message);
};

const getAttachmentForDownload = async (attachmentId, userId) => {
  const attachment = await MessageAttachment.findOne({
    where: { id: attachmentId },
    include: [{ model: Message, as: "message", attributes: ["id", "senderId", "recipientId"] }],
  });

  if (!attachment) {
    const error = new Error("Pièce jointe introuvable");
    error.statusCode = 404;
    throw error;
  }

  if (attachment.message.senderId !== userId && attachment.message.recipientId !== userId) {
    const error = new Error("Vous n'êtes pas autorisé à télécharger cette pièce jointe");
    error.statusCode = 403;
    throw error;
  }

  return {
    id: attachment.id,
    originalName: attachment.originalName,
    filePath: attachment.filePath,
    mimeType: attachment.mimeType,
  };
};

module.exports = {
  ROLE_RECIPIENTS,
  getRecipientOptionsForRole,
  getAvailableRecipientsForUser,
  getInboxForUser,
  getSentMessagesForUser,
  sendMessage,
  markMessageAsRead,
  getAttachmentForDownload,
};
