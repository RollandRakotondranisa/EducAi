const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
    }

    // Vérifier le rôle
    if (!allowedRoles.includes(req.user.role)
      && !(req.user.isSuperAdmin && allowedRoles.includes("ADMIN"))) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit : permissions insuffisantes",
      });
    }

    if (req.user.isSuperAdmin && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const path = req.path.split("?")[0];
      const canManageAccounts = /^\/admin\/users(?:\/|$)/.test(path);
      const canReviewRequests = /^\/admin\/(?:approve|reject)-request\/\d+$/.test(path);
      const canUseSuperAdminTools = path.startsWith("/super-admin/");
      if (!canManageAccounts && !canReviewRequests && !canUseSuperAdminTools) {
        return res.status(403).json({
          success: false,
          message: "Le super-administrateur consulte les données globales ; les opérations métier doivent être réalisées par un administrateur d'établissement.",
        });
      }
    }

    next();
  };
};

module.exports = authorize;