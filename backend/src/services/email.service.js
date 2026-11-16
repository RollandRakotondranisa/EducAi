const nodemailer = require("nodemailer");

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  const missing = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_PORT", SMTP_PORT],
    ["SMTP_USER", SMTP_USER],
    ["SMTP_PASSWORD", SMTP_PASSWORD],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Configuration e-mail incomplète : ${missing.join(", ")}.`);
    error.statusCode = 503;
    throw error;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

async function sendInvitationEmail({ email, role }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const roleLabel = { TEACHER: "enseignant", STUDENT: "étudiant", ADMIN: "administrateur" }[role];
  const registrationUrl = `${frontendUrl}/inscription?email=${encodeURIComponent(email)}&role=${role.toLowerCase()}`;
  const info = await getTransporter().sendMail({
    from: `EduAI <${from}>`, to: email, subject: "Invitation à rejoindre EduAI",
    text: `Bonjour,\n\nVous êtes invité(e) à rejoindre EduAI en tant qu'${roleLabel}. Créez votre compte ici : ${registrationUrl}\n\nL'équipe EduAI`,
    html: `<p>Bonjour,</p><p>Vous êtes invité(e) à rejoindre <strong>EduAI</strong> en tant qu’<strong>${roleLabel}</strong>.</p><p><a href="${registrationUrl}">Créer mon compte</a></p><p>L’équipe EduAI</p>`,
  });
  return { messageId: info.messageId };
}

async function sendUserCreatedEmail({ email, firstName, password, role }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const roleLabel = { TEACHER: "enseignant", STUDENT: "étudiant" }[role];
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
  const safeFirstName = escapeHtml(firstName);
  const safePassword = escapeHtml(password);
  const info = await getTransporter().sendMail({
    from: `EduAI <${from}>`,
    to: email,
    subject: "Bienvenue sur la plateforme EduAI",
    text: `Bonjour ${firstName},\n\nVotre compte EduAI a été créé. Vous êtes inscrit(e) en tant qu'${roleLabel} sur la plateforme EduAI.\n\nIdentifiant de connexion : ${email}\nMot de passe initial : ${password}\n\nVous pouvez vous connecter ici : ${frontendUrl}/connexion\nAprès votre connexion, vous pourrez changer votre mot de passe depuis votre profil.\n\nL'équipe EduAI`,
    html: `<p>Bonjour ${safeFirstName},</p><p>Votre compte <strong>EduAI</strong> a été créé. Vous êtes inscrit(e) en tant qu’<strong>${roleLabel}</strong> sur la plateforme EduAI.</p><p><strong>Identifiant de connexion :</strong> ${escapeHtml(email)}<br><strong>Mot de passe initial :</strong> ${safePassword}</p><p><a href="${frontendUrl}/connexion">Accéder à la plateforme</a></p><p>Après votre connexion, vous pourrez changer votre mot de passe depuis votre profil.</p><p>L’équipe EduAI</p>`,
  });
  return { messageId: info.messageId };
}

module.exports = { sendInvitationEmail, sendUserCreatedEmail };
