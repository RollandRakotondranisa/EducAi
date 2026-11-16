import {
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  LogOut,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  getCurrentUserName,
  getCurrentUserRoleLabel,
  readSession,
  saveSession,
} from "@/utils/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// === COMPOSANTS RÉUTILISABLES ===

function Avatar({ name, avatar, onChange, inputRef }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AD";

  return (
    <div className="avatar-pro">
      {avatar ? <img src={avatar} alt="Photo de profil" className="size-full rounded-full object-cover" /> : initials}
      <label className="avatar-overlay" htmlFor="avatar-upload">
        <Camera className="size-6" />
        <input
          id="avatar-upload"
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(event) => { onChange(event);
            // TODO: Implémenter l'upload
          }}
        />
      </label>
      <span className="avatar-online-dot" aria-hidden="true"></span>
    </div>
  );
}

function PasswordStrengthMeter({ password }) {
  const strength = useMemo(() => {
    let score = 0;
    if (!password) return { score: 0, label: "", class: "" };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: "Faible", class: "weak" };
    if (score <= 3) return { score: 2, label: "Moyen", class: "fair" };
    if (score <= 4) return { score: 3, label: "Bon", class: "good" };
    return { score: 4, label: "Très fort", class: "strong" };
  }, [password]);

  const bars = [1, 2, 3, 4];

  if (!password) return null;

  return (
    <div>
      <div className="password-strength-meter">
        {bars.map((level) => (
          <div
            key={level}
            className={`strength-bar ${
              strength.score >= level ? `active ${strength.class}` : ""
            }`}
          />
        ))}
      </div>
      <span className={`strength-label ${strength.class}`}>
        <ShieldCheck className="size-3" />
        {strength.label}
      </span>
    </div>
  );
}

function PasswordRequirements({ password }) {
  const requirements = [
    { label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
    { label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
    { label: "Une lettre minuscule", test: (p) => /[a-z]/.test(p) },
    { label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
    { label: "Un caractère spécial (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  if (!password) return null;

  return (
    <div className="password-requirements">
      <div className="password-requirements-title">
        Critères de sécurité
      </div>
      {requirements.map((req) => {
        const met = req.test(password);
        return (
          <div
            key={req.label}
            className={`requirement-item ${met ? "met" : ""}`}
          >
            <span className="requirement-icon">
              {met ? (
                <CheckCircle2 className="size-3 text-white" />
              ) : (
                <span className="block size-1.5 rounded-full bg-muted-foreground/50"></span>
              )}
            </span>
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  children,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group-pro">
      <Label htmlFor={id}>
        {label}
        {required && <span className="required-star">*</span>}
      </Label>
      <div className="password-input-wrapper">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder || "••••••••"}
          value={value}
          onChange={onChange}
          required={required}
          className="pr-10"
          autoComplete={id.includes("new") ? "new-password" : "current-password"}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}

function TwoFACard({ enabled, onToggle }) {
  return (
    <div className={`twofa-card ${enabled ? "active" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="twofa-icon">
            <Fingerprint className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Authentification à deux facteurs
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {enabled
                ? "Activée depuis le 12/03/2026"
                : "Protégez votre compte avec 2FA"}
            </p>
          </div>
        </div>
        <div
          role="switch"
          aria-checked={enabled}
          aria-label="Activer l'authentification à deux facteurs"
          tabIndex={0}
          className={`toggle-switch ${enabled ? "active" : ""}`}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
        />
      </div>
    </div>
  );
}

function SuccessToast({ message, onClose, exiting }) {
  return (
    <div
      className={`success-toast ${exiting ? "exiting" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="success-toast-icon">
        <CheckCircle2 className="size-5" />
      </div>
      <span className="flex-1 text-sm font-semibold text-success">
        {message}
      </span>
      <button
        onClick={onClose}
        className="rounded p-1 text-success transition hover:bg-success/10"
        aria-label="Fermer"
      >
        <AlertTriangle className="size-4" />
      </button>
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

function Page() {
  const navigate = useNavigate();
  const { user } = readSession();
  const initialName = getCurrentUserName(user);
  const initialEmail = user?.email ?? "admin@eduai.local";

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [toast, setToast] = useState(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("educai_access_token")}` });
  const saveUser = (profile) => {
    const session = readSession();
    saveSession({ user: { ...session.user, ...profile }, accessToken: session.accessToken, refreshToken: session.refreshToken });
    setName(`${profile.firstName} ${profile.lastName}`.trim());
    setEmail(profile.email);
    setAvatar(profile.avatar || "");
  };

  useEffect(() => {
    axios.get(`${API_BASE}/auth/profile`, { headers: authHeaders() })
      .then((response) => saveUser(response.data.data))
      .catch(() => {});
  }, []);

  const showToast = (message) => {
    setToast({ message, exiting: false });
    setTimeout(() => {
      setToast((t) => (t ? { ...t, exiting: true } : null));
      setTimeout(() => setToast(null), 300);
    }, 3500);
  };

  const closeToast = () => {
    setToast((t) => (t ? { ...t, exiting: true } : null));
    setTimeout(() => setToast(null), 300);
  };

  async function handleSaveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");

    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setProfileError("Veuillez saisir votre prénom et votre nom.");
      setSavingProfile(false);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError("Veuillez saisir une adresse e-mail valide.");
      setSavingProfile(false);
      return;
    }

    try {
      const response = await axios.put(`${API_BASE}/auth/profile`, {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
        email,
      }, { headers: authHeaders() });
      saveUser(response.data.data);
      // TODO: Implémenter l'appel API pour mettre à jour le profil
      showToast("Profil mis à jour avec succès");
    } catch (error) {
      setProfileError(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du profil"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.");
      setSavingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
      setSavingPassword(false);
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );
      setSavingPassword(false);
      return;
    }

    try {
      await axios.put(`${API_BASE}/auth/profile/password`, {
        currentPassword,
        newPassword,
      }, { headers: authHeaders() });
      // TODO: Implémenter l'appel API pour changer le mot de passe
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Mot de passe mis à jour avec succès");
    } catch (error) {
      setPasswordError(
        error.response?.data?.message ||
          "Erreur lors du changement de mot de passe"
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileError("Choisissez une image PNG ou JPG de 2 Mo maximum.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setSavingProfile(true);
        setProfileError("");
        const response = await axios.put(`${API_BASE}/auth/profile/avatar`, { avatar: reader.result }, { headers: authHeaders() });
        saveUser(response.data.data);
        showToast("Photo de profil mise à jour avec succès");
      } catch (error) {
        setProfileError(error.response?.data?.message || "Erreur lors de l'envoi de la photo.");
      } finally {
        setSavingProfile(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    try {
      const accessToken = localStorage.getItem("educai_access_token");

      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => {
        // On ignore l'erreur côté serveur, on nettoie côté client
      });

      localStorage.removeItem("educai_user");
      localStorage.removeItem("educai_access_token");
      localStorage.removeItem("educai_refresh_token");
      localStorage.removeItem("educai_session");

      navigate("/connexion", { replace: true });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      localStorage.removeItem("educai_user");
      localStorage.removeItem("educai_access_token");
      localStorage.removeItem("educai_refresh_token");
      localStorage.removeItem("educai_session");
      navigate("/connexion", { replace: true });
    }
  }

  return (
    <>
      {/* === INFORMATIONS PERSONNELLES === */}
      <SectionCard className="section-card-pro">
        <div className="section-header">
          <div className="section-header-icon">
            <User className="size-5" />
          </div>
          <div className="section-header-title">
            <h3>Informations personnelles</h3>
            <p>Votre identité sur la plateforme EduAI</p>
          </div>
          <span
            className={`role-badge-pro ${
              getCurrentUserRoleLabel(user) === "Administrateur"
                ? "role-badge-admin"
                : ""
            }`}
          >
            <ShieldCheck className="size-3.5" />
            {getCurrentUserRoleLabel(user)}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Avatar name={name} avatar={avatar} onChange={handleAvatarChange} />
            <div className="flex-1 space-y-2">
              <h4 className="text-lg font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Button type="button" variant="outline" className="mt-2" onClick={() => document.getElementById("avatar-upload")?.click()} disabled={savingProfile}>
                <Camera className="size-4" />
                Changer la photo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG ou JPG, 2 Mo max.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="form-group-pro">
              <Label htmlFor="profile-name">
                Nom complet
                <span className="required-star">*</span>
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom complet"
                required
              />
            </div>
            <div className="form-group-pro">
              <Label htmlFor="profile-email">
                Adresse e-mail
                <span className="required-star">*</span>
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-email"
                  type="email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@eduai.fr"
                  required
                />
              </div>
            </div>
          </div>

          {profileError && (
            <div className="error-message" role="alert">
              <AlertTriangle className="error-message-icon size-4" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={savingProfile}
              className="btn-gradient"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* === SÉCURITÉ === */}
      <SectionCard className="section-card-pro">
        <div className="section-header">
          <div className="section-header-icon">
            <Lock className="size-5" />
          </div>
          <div className="section-header-title">
            <h3>Sécurité du compte</h3>
            <p>Mot de passe et authentification à deux facteurs</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <PasswordInput
              id="current-password"
              label="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <PasswordInput
              id="new-password"
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            >
              <PasswordStrengthMeter password={newPassword} />
            </PasswordInput>
            <PasswordInput
              id="confirm-password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <PasswordRequirements password={newPassword} />

          {passwordError && (
            <div className="error-message" role="alert">
              <AlertTriangle className="error-message-icon size-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="pt-2">
            <TwoFACard
              enabled={twoFAEnabled}
              onToggle={() => setTwoFAEnabled(!twoFAEnabled)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="btn-gradient"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Mise à jour...</span>
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  <span>Mettre à jour le mot de passe</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* === DÉCONNEXION === */}
      <SectionCard className="section-card-pro logout-section">
        <div className="section-header" style={{ borderColor: "rgb(239 68 68 / 0.2)" }}>
          <div
            className="section-header-icon"
            style={{
              background:
                "linear-gradient(135deg, var(--error-soft) 0%, #fee2e2 100%)",
              color: "var(--error)",
            }}
          >
            <LogOut className="size-5" />
          </div>
          <div className="section-header-title">
            <h3>Terminer la session</h3>
            <p>
              Connecté en tant que{" "}
              <strong className="text-foreground">{initialName}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 flex-shrink-0 text-error mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Déconnexion de votre session
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vous devrez vous reconnecter pour accéder à la plateforme.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowLogoutConfirm(true)}
            className="logout-button"
          >
            <LogOut className="size-4" />
            <span>Se déconnecter</span>
          </Button>
        </div>
      </SectionCard>

      {/* === MODAL DE CONFIRMATION DE DÉCONNEXION === */}
      {showLogoutConfirm && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="modal-content card-surface w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "var(--error-soft)" }}
              >
                <LogOut className="size-6 text-error" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Confirmer la déconnexion
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cette action va fermer votre session active.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                className="logout-button flex-1"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === TOAST DE SUCCÈS === */}
      {toast && (
        <SuccessToast
          message={toast.message}
          onClose={closeToast}
          exiting={toast.exiting}
        />
      )}
    </>
  );
}

export default Page;
