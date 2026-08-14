const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
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

    // Ajouter les informations de l'utilisateur à la requête
    req.user = decoded;

    next();
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