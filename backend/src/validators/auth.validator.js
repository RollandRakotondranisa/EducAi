const { body } = require("express-validator");

const registerValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est obligatoire")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le prénom doit contenir entre 2 et 100 caractères"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Le nom est obligatoire")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est obligatoire")
    .isEmail()
    .withMessage("L'email est invalide")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères"),

  body("role")
    .optional()
    .isIn(["ADMIN", "TEACHER", "STUDENT"])
    .withMessage("Rôle invalide"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est obligatoire")
    .isEmail()
    .withMessage("L'email est invalide")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire"),
];

module.exports = {
  registerValidator,
  loginValidator,
};