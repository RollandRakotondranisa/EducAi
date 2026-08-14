
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Session = require("../models/Session");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

const { hashToken } = require("../utils/hash");


// =====================================================
// REGISTER
// =====================================================

const register = async ({
  firstName,
  lastName,
  email,
  password,
  role,
}) => {

  // ---------------------------------------------
  // 1. Vérifier si l'utilisateur existe
  // ---------------------------------------------

  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {

    const error = new Error(
      "Cette adresse email est déjà utilisée"
    );

    error.statusCode = 409;

    throw error;
  }


  // ---------------------------------------------
  // 2. Hasher le mot de passe
  // ---------------------------------------------

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );


  // ---------------------------------------------
  // 3. Déterminer le rôle
  // ---------------------------------------------
  //
  // Un utilisateur normal ne doit pas pouvoir
  // créer lui-même un ADMIN.
  //
  // Pour le moment :
  // - TEACHER autorisé
  // - STUDENT par défaut
  //
  // La création ADMIN sera réservée à l'admin.
  // ---------------------------------------------

  let userRole = "STUDENT";

  if (role === "TEACHER") {
    userRole = "TEACHER";
  }


  // ---------------------------------------------
  // 4. Créer l'utilisateur
  // ---------------------------------------------

  const user = await User.create({

    firstName,

    lastName,

    email,

    password: hashedPassword,

    role: userRole,

  });


  // ---------------------------------------------
  // 5. Retourner les informations publiques
  // ---------------------------------------------

  return {

    id: user.id,

    firstName: user.firstName,

    lastName: user.lastName,

    email: user.email,

    role: user.role,

    isActive: user.isActive,

    createdAt: user.createdAt,

  };
};


// =====================================================
// LOGIN
// =====================================================

const login = async ({
  email,
  password,
  deviceInfo,
  ipAddress,
}) => {

  // ---------------------------------------------
  // 1. Rechercher l'utilisateur
  // ---------------------------------------------

  const user = await User.findOne({
    where: { email },
  });


  if (!user) {

    const error = new Error(
      "Email ou mot de passe incorrect"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 2. Vérifier si le compte est actif
  // ---------------------------------------------

  if (user.isActive === false) {

    const error = new Error(
      "Votre compte est désactivé"
    );

    error.statusCode = 403;

    throw error;
  }


  // ---------------------------------------------
  // 3. Vérifier le mot de passe
  // ---------------------------------------------

  const isPasswordValid =
    await bcrypt.compare(
      password,
      user.password
    );


  if (!isPasswordValid) {

    const error = new Error(
      "Email ou mot de passe incorrect"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 4. Créer la session
  // ---------------------------------------------

  const session = await Session.create({

    userId: user.id,

    deviceInfo:
      deviceInfo || "Unknown device",

    ipAddress:
      ipAddress || null,

    expiresAt: new Date(
      Date.now() +
      7 * 24 * 60 * 60 * 1000
    ),

    // Valeur temporaire.
    // Elle sera remplacée juste après.
    refreshTokenHash: "temporary",

  });


  // ---------------------------------------------
  // 5. Générer Access Token
  // ---------------------------------------------

  const accessToken =
    generateAccessToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 6. Générer Refresh Token
  // ---------------------------------------------

  const refreshToken =
    generateRefreshToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 7. Hasher le Refresh Token
  // ---------------------------------------------

  session.refreshTokenHash =
    hashToken(refreshToken);


  // ---------------------------------------------
  // 8. Sauvegarder la session
  // ---------------------------------------------

  await session.save();


  // ---------------------------------------------
  // 9. Retourner la réponse
  // ---------------------------------------------

  return {

    user: {

      id: user.id,

      firstName: user.firstName,

      lastName: user.lastName,

      email: user.email,

      role: user.role,

    },

    accessToken,

    refreshToken,

    session: {

      id: session.id,

      deviceInfo: session.deviceInfo,

      ipAddress: session.ipAddress,

      expiresAt: session.expiresAt,

    },

  };
};


// =====================================================
// REFRESH TOKEN
// =====================================================

const refresh = async (refreshToken) => {

  // ---------------------------------------------
  // 1. Vérifier la présence du token
  // ---------------------------------------------

  if (!refreshToken) {

    const error = new Error(
      "Refresh token manquant"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 2. Vérifier le JWT
  // ---------------------------------------------

  let decoded;

  try {

    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

  } catch (error) {

    const authError = new Error(
      "Refresh token invalide ou expiré"
    );

    authError.statusCode = 401;

    throw authError;
  }


  // ---------------------------------------------
  // 3. Vérifier sessionId
  // ---------------------------------------------

  if (!decoded.sessionId) {

    const error = new Error(
      "Session invalide"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 4. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findByPk(
      decoded.sessionId
    );


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 5. Vérifier si la session est révoquée
  // ---------------------------------------------

  if (session.revokedAt) {

    const error = new Error(
      "Cette session a été révoquée"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 6. Vérifier expiration
  // ---------------------------------------------

  if (
    new Date() >
    new Date(session.expiresAt)
  ) {

    const error = new Error(
      "Cette session a expiré"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 7. Vérifier le hash du token
  // ---------------------------------------------

  const tokenHash =
    hashToken(refreshToken);


  if (
    tokenHash !==
    session.refreshTokenHash
  ) {

    const error = new Error(
      "Refresh token invalide"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 8. Rechercher l'utilisateur
  // ---------------------------------------------

  const user =
    await User.findByPk(
      session.userId
    );


  if (!user) {

    const error = new Error(
      "Utilisateur introuvable"
    );

    error.statusCode = 401;

    throw error;
  }


  // ---------------------------------------------
  // 9. Vérifier le compte
  // ---------------------------------------------

  if (user.isActive === false) {

    const error = new Error(
      "Votre compte est désactivé"
    );

    error.statusCode = 403;

    throw error;
  }


  // ---------------------------------------------
  // 10. Générer nouveau Access Token
  // ---------------------------------------------

  const newAccessToken =
    generateAccessToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 11. Générer nouveau Refresh Token
  // ---------------------------------------------

  const newRefreshToken =
    generateRefreshToken(
      user,
      session.id
    );


  // ---------------------------------------------
  // 12. Rotation du Refresh Token
  // ---------------------------------------------

  session.refreshTokenHash =
    hashToken(newRefreshToken);


  await session.save();


  // ---------------------------------------------
  // 13. Retourner les nouveaux tokens
  // ---------------------------------------------

  return {

    accessToken:
      newAccessToken,

    refreshToken:
      newRefreshToken,

  };
};


// =====================================================
// LOGOUT — SESSION COURANTE
// =====================================================

const logout = async (
  userId,
  sessionId
) => {

  // ---------------------------------------------
  // 1. Vérifier sessionId
  // ---------------------------------------------

  if (!sessionId) {

    const error = new Error(
      "Session ID manquant"
    );

    error.statusCode = 400;

    throw error;
  }


  // ---------------------------------------------
  // 2. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findOne({

      where: {

        id: sessionId,

        userId: userId,

      },

    });


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // ---------------------------------------------
  // 3. Révoquer la session
  // ---------------------------------------------

  session.revokedAt =
    new Date();


  await session.save();


  return true;
};


// =====================================================
// GET ALL SESSIONS
// =====================================================

const getSessions = async (userId) => {

  const sessions =
    await Session.findAll({

      where: {
        userId: userId,
      },

      attributes: [

        "id",

        "deviceInfo",

        "ipAddress",

        "expiresAt",

        "revokedAt",

        "createdAt",

        "updatedAt",

      ],

      order: [
        ["createdAt", "DESC"],
      ],

    });


  return sessions;
};


// =====================================================
// REVOKE ONE SESSION
// =====================================================

const revokeSession = async (
  userId,
  sessionId
) => {

  // ---------------------------------------------
  // 1. Vérifier sessionId
  // ---------------------------------------------

  if (!sessionId) {

    const error = new Error(
      "Session ID manquant"
    );

    error.statusCode = 400;

    throw error;
  }


  // ---------------------------------------------
  // 2. Rechercher la session
  // ---------------------------------------------

  const session =
    await Session.findOne({

      where: {

        id: sessionId,

        userId: userId,

      },

    });


  if (!session) {

    const error = new Error(
      "Session introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // ---------------------------------------------
  // 3. Révoquer
  // ---------------------------------------------

  session.revokedAt =
    new Date();


  await session.save();


  return true;
};


// =====================================================
// LOGOUT ALL
// =====================================================

const logoutAll = async (userId) => {

  await Session.update(

    {
      revokedAt: new Date(),
    },

    {
      where: {

        userId: userId,

        revokedAt: null,

      },
    }

  );


  return true;
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

  register,

  login,

  refresh,

  logout,

  getSessions,

  revokeSession,

  logoutAll,

};