require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const User = require("../models/User");
const UserRequest = require("../models/UserRequest");
const Session = require("../models/Session");

async function main() {
  const firstName = String(process.env.SUPER_ADMIN_FIRST_NAME || "").trim();
  const lastName = String(process.env.SUPER_ADMIN_LAST_NAME || "").trim();
  const email = String(process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "";
  if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Définissez SUPER_ADMIN_FIRST_NAME, SUPER_ADMIN_LAST_NAME et SUPER_ADMIN_EMAIL.");
  }
  if (password.length < 20) {
    throw new Error("SUPER_ADMIN_PASSWORD doit contenir au moins 20 caractères, générés aléatoirement.");
  }
  if (await User.count({ where: { isSuperAdmin: true } })) {
    throw new Error("Un compte super-administrateur existe déjà.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      throw new Error("Cette adresse appartient déjà à un compte non administrateur; aucune élévation automatique n'est effectuée.");
    }
    await sequelize.transaction(async (transaction) => {
      await existingUser.update({
        firstName,
        lastName,
        password: passwordHash,
        role: "ADMIN",
        isActive: true,
        isSuperAdmin: true,
        superAdminKey: "SUPER_ADMIN",
        organizationId: null,
      }, { transaction });
      await UserRequest.destroy({ where: { userId: existingUser.id, status: "PENDING" }, transaction });
      await Session.update(
        { revokedAt: new Date() },
        { where: { userId: existingUser.id, revokedAt: null }, transaction },
      );
    });
    console.log(`Compte administrateur existant converti en super-administrateur pour ${email}.`);
    return;
  }

  await User.create({
    firstName,
    lastName,
    email,
    password: passwordHash,
    role: "ADMIN",
    isActive: true,
    isSuperAdmin: true,
    superAdminKey: "SUPER_ADMIN",
    organizationId: null,
  });
  console.log(`Compte super-administrateur créé pour ${email}.`);
}

main()
  .catch((error) => {
    console.error("Échec de création du super-administrateur:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
