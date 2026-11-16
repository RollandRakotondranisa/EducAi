const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const UserRequest = require("../models/UserRequest");
const Organization = require("../models/Organization");
const Session = require("../models/Session");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const { hashToken } = require("../utils/hash");
const { logAudit } = require("../utils/audit");

const PROVIDERS = {
  google: { authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token", userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo", scope: "openid email profile", clientId: () => process.env.GOOGLE_CLIENT_ID, clientSecret: () => process.env.GOOGLE_CLIENT_SECRET },
};

function providerFor(name) {
  const provider = PROVIDERS[name];
  if (!provider || !provider.clientId() || !provider.clientSecret()) {
    const error = new Error("Ce fournisseur de connexion n'est pas encore configuré.");
    error.statusCode = 503;
    throw error;
  }
  return provider;
}

const backendUrl = () => (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
const callbackUrl = (provider) => `${backendUrl()}/api/auth/oauth/${provider}/callback`;
const frontUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const loginUrl = (params, page = "connexion") => `${frontUrl()}/${page === "inscription" ? "inscription" : "connexion"}#${new URLSearchParams(params).toString()}`;

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("La vérification auprès du fournisseur a échoué.");
    error.statusCode = 401;
    throw error;
  }
  return json;
}

function authorizationUrl(name, state) {
  const provider = providerFor(name);
  const url = new URL(typeof provider.authorizationUrl === "function" ? provider.authorizationUrl() : provider.authorizationUrl);
  url.search = new URLSearchParams({ client_id: provider.clientId(), redirect_uri: callbackUrl(name), response_type: "code", scope: provider.scope, state, prompt: "select_account" }).toString();
  return url.toString();
}

async function profileFor(name, code) {
  const provider = providerFor(name);
  const tokenUrl = typeof provider.tokenUrl === "function" ? provider.tokenUrl() : provider.tokenUrl;
  const token = await requestJson(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: provider.clientId(), client_secret: provider.clientSecret(), code, redirect_uri: callbackUrl(name), grant_type: "authorization_code" }) });
  if (!token.access_token) throw new Error("Le fournisseur n'a pas retourné de jeton d'accès.");
  const profile = await requestJson(provider.userInfoUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const email = profile.email || profile.mail || profile.userPrincipalName;
  if (!email) {
    const error = new Error("Aucune adresse e-mail n'a été fournie par ce compte.");
    error.statusCode = 400;
    throw error;
  }
  const names = String(profile.name || profile.displayName || [profile.given_name || profile.givenName, profile.family_name || profile.surname].filter(Boolean).join(" ")).trim().split(/\s+/).filter(Boolean);
  return { email: String(email).trim().toLowerCase(), firstName: names[0] || "Utilisateur", lastName: names.slice(1).join(" ") || "OAuth" };
}

async function createSession(user, deviceInfo, ipAddress) {
  const session = await Session.create({ userId: user.id, deviceInfo: deviceInfo || "OAuth", ipAddress: ipAddress || null, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), refreshTokenHash: "temporary" });
  const accessToken = generateAccessToken(user, session.id);
  const refreshToken = generateRefreshToken(user, session.id);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();
  const organization = user.organizationId
    ? await Organization.findByPk(user.organizationId, { attributes: ["id", "name"] })
    : null;
  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: organization?.name || null,
      isSuperAdmin: Boolean(user.isSuperAdmin),
    },
    accessToken,
    refreshToken,
  };
}

async function loginWithOAuth(provider, code, deviceInfo, ipAddress, registration = {}) {
  const profile = await profileFor(provider, code);
  let user = await User.findOne({ where: { email: profile.email } });
  if (!user) {
    const organizationName = typeof registration.institutionName === "string" ? registration.institutionName.trim() : "";
    const role = ["STUDENT", "TEACHER", "ADMIN"].includes(String(registration.role).toUpperCase())
      ? String(registration.role).toUpperCase()
      : "STUDENT";
    if (!organizationName || organizationName.length > 180) {
      const error = new Error("Indiquez le nom de votre école ou université dans le formulaire d'inscription.");
      error.statusCode = 400;
      throw error;
    }
    const normalizedName = organizationName.toLocaleLowerCase("fr").replace(/\s+/g, " ");
    const [organization] = await Organization.findOrCreate({
      where: { normalizedName },
      defaults: { name: organizationName, normalizedName },
    });
    if (organization.isLegacy) {
      const error = new Error("Cet établissement est réservé au rattachement des données historiques.");
      error.statusCode = 400;
      throw error;
    }
    user = await User.create({
      ...profile,
      password: await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 12),
      role,
      isActive: false,
      organizationId: organization.id,
    });
    await UserRequest.create({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      requestedRole: role,
      status: "PENDING",
      organizationId: organization.id,
    });
    await logAudit(user.id, "OAUTH_REGISTER_PENDING", `Compte créé via ${provider}, en attente de validation.`, user.id, {
      status: "SUCCESS",
      organizationId: organization.id,
    });
  }
  if (!user.isActive) {
    const error = new Error("Votre compte est désactivé ou en attente d'activation par l'administrateur.");
    error.statusCode = 403;
    error.code = "ACCOUNT_PENDING";
    error.email = user.email;
    throw error;
  }
  const result = await createSession(user, deviceInfo, ipAddress);
  await logAudit(user.id, "OAUTH_LOGIN", `Connexion via ${provider}.`, user.id, { status: "SUCCESS" });
  return result;
}

module.exports = { authorizationUrl, loginWithOAuth, loginUrl };
