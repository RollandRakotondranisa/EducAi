const express = require("express");

const authController = require("../controllers/auth.controller");

const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");

const validate = require("../middleware/validation.middleware");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

// IMPORTANT : créer router AVANT router.get() / router.post()
const router = express.Router();


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);


// =====================================================
// ME - UTILISATEUR CONNECTÉ
// =====================================================

router.get(
  "/me",
  authenticate,
  authController.getMe
);


// =====================================================
// REFRESH TOKEN
// =====================================================

router.post(
  "/refresh",
  authController.refresh
);


// =====================================================
// LOGOUT
// =====================================================

router.post(
  "/logout",
  authenticate,
  authController.logout
);


// =====================================================
// ADMIN TEST
// =====================================================

router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Bienvenue administrateur",
      user: req.user,
    });
  }
);


module.exports = router;