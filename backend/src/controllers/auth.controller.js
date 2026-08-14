const authService = require("../services/auth.service");


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// ME
// =====================================================

const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Utilisateur authentifié",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// REFRESH TOKEN
// =====================================================

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result =
      await authService.refresh(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token renouvelé avec succès",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res, next) => {
  try {

    await authService.logout(
      req.user.id,
      req.user.sessionId
    );

    return res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};