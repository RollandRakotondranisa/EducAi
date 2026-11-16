const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const User = require("../models/User");
const Organization = require("../models/Organization");
const { tenantContext } = require("../utils/tenant-context");

const authenticate = async (req, res, next) => {
  try {
    // Récupérer le header Authorization
    const authHeader = req.headers.authorization;

    // Vérifier que le header existe
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
      });
    }

    // Vérifier le format : Bearer TOKEN
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Format du token invalide",
      });
    }

    const token = parts[1];

    // Vérifier le JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    if (!decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Session invalide, veuillez vous reconnecter",
      });
    }

    const session = await Session.findOne({
      where: { id: decoded.sessionId, userId: decoded.id, revokedAt: null },
    });
    if (!session || new Date(session.expiresAt) <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expirée ou révoquée",
      });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "isActive", "role", "organizationId", "isSuperAdmin"],
    });
    if (!user || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Ce compte est désactivé. Contactez un administrateur pour rétablir l'accès.",
      });
    }
    if (String(decoded.role).toUpperCase() !== user.role) {
      return res.status(401).json({
        success: false,
        message: "Les autorisations de ce compte ont changé. Veuillez vous reconnecter.",
      });
    }
    if (!user.isSuperAdmin) {
      const organization = user.organizationId
        ? await Organization.findByPk(user.organizationId, { attributes: ["id", "isLegacy"] })
        : null;
      if (!organization) {
        return res.status(403).json({
          success: false,
          message: "Ce compte doit être rattaché à un établissement par le super-administrateur avant de pouvoir accéder à la plateforme.",
        });
      }
      if (organization.isLegacy) {
        return res.status(403).json({
          success: false,
          message: "Ce compte historique doit être rattaché à un établissement par le super-administrateur avant de pouvoir accéder à la plateforme.",
        });
      }
    }

    req.user = {
      ...decoded,
      organizationId: user.organizationId,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    };

    tenantContext.run({
      organizationId: user.organizationId,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    }, next);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Le token a expiré",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'authentification",
    });
  }
};

module.exports = authenticate;