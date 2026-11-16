const { Op } = require("sequelize");
const Audit = require("../models/Audit");
const User = require("../models/User");

/**
 * Enregistre une action d'audit pour tracer les activités des utilisateurs
 * @param {number} userId - ID de l'utilisateur qui effectue l'action
 * @param {string} action - Type d'action (LOGIN, LOGOUT, CREATE_USER, etc.)
 * @param {string} description - Description détaillée de l'action
 * @param {number} targetUserId - ID de l'utilisateur affecté (optionnel)
 * @param {object} options - Options additionnelles { ipAddress, userAgent, status, metadata }
 */
async function logAudit(userId, action, description, targetUserId = null, options = {}) {
  try {
    const auditEntry = {
      userId,
      action,
      description,
      targetUserId,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      status: options.status || "SUCCESS",
      metadata: options.metadata || null,
      ...(options.organizationId ? { organizationId: options.organizationId } : {}),
    };

    await Audit.create(auditEntry);
    console.log(`[AUDIT] ${action} by user ${userId}`);
  } catch (error) {
    console.error(`[AUDIT ERROR] Failed to log audit: ${error.message}`);
    // Ne pas lever l'erreur, juste logger
  }
}

/**
 * Récupère les logs d'audit avec filtres optionnels
 * @param {object} filters - Filtres { userId, action, targetUserId, startDate, endDate }
 * @param {number} limit - Nombre max de résultats (défaut: 100)
 * @param {number} offset - Offset pour pagination (défaut: 0)
 */
async function getAuditLogs(filters = {}, limit = 100, offset = 0) {
  try {
    const where = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.targetUserId) where.targetUserId = filters.targetUserId;
    if (Array.isArray(filters.relevantUserIds)) {
      where[Op.or] = [
        { userId: { [Op.in]: filters.relevantUserIds } },
        { targetUserId: { [Op.in]: filters.relevantUserIds } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const { count, rows } = await Audit.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const userIds = [...new Set(rows.map((row) => row.userId).filter(Boolean))];
    const users = userIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ["id", "firstName", "lastName", "email"],
        })
      : [];
    const usersById = new Map(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        },
      ])
    );

    const data = rows.map((row) => ({
      ...row.toJSON(),
      user: usersById.get(row.userId) || null,
    }));

    return {
      total: count,
      data,
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    console.error(`[AUDIT ERROR] Failed to retrieve audit logs: ${error.message}`);
    throw error;
  }
}

module.exports = {
  logAudit,
  getAuditLogs,
};
