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
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit : permissions insuffisantes",
      });
    }

    next();
  };
};

module.exports = authorize;