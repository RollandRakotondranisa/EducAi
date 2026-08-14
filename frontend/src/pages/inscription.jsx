import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/RadioGroup";
import apiFetch from "@/utils/api";

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Simulation d'appel API — remplacez par votre endpoint réel :
 *   const res = await fetch("/api/auth/register", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(payload),
 *     signal,
 *   });
 *   if (!res.ok) {
 *     const err = new Error(res.status === 409 ? "EMAIL_ALREADY_USED" : "SERVER_ERROR");
 *     err.status = res.status;
 *     throw err;
 *   }
 *   return res.json();
 */
async function registerUser(payload, signal) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: payload,
    signal,
    credentials: "same-origin",
  });
}

/* =========================================================
   UTILS
   ========================================================= */

function computePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: " ", color: "bg-border" };
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { label: "Très faible", color: "bg-error" },
    { label: "Faible", color: "bg-error/70" },
    { label: "Moyen", color: "bg-amber-500" },
    { label: "Bon", color: "bg-success/70" },
    { label: "Très bon", color: "bg-success" },
    { label: "Excellent", color: "bg-success" },
  ];
  const level = levels[Math.min(score, levels.length - 1)];
  return { score, ...level };
}

function getErrorMessage(error) {
  if (!error) return "";
  if (error === "AbortError") {
    return "La requête a expiré. Vérifiez votre connexion, puis réessayez.";
  }
  if (error === "EMAIL_ALREADY_USED") {
    return "Cette adresse e-mail est déjà associée à un compte.";
  }
  if (error === "NETWORK") {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }
  if (error === "SERVER_ERROR") {
    return "Une erreur inattendue est survenue côté serveur. Merci de réessayer.";
  }
  return error;
}

/* =========================================================
   HERO LATÉRAL (intro)
   ========================================================= */

function SignUpHero() {
  const benefits = [
    { icon: Upload, text: "Analyse automatique de vos supports de cours" },
    { icon: Sparkles, text: "Génération d'évaluations adaptées au niveau" },
    { icon: ShieldCheck, text: "Données hébergées en Europe, conforme RGPD" },
  ];

  return (
    <div className="relative hidden overflow-hidden rounded-2xl bg-primary-deep p-10 text-primary-foreground lg:block xl:p-14">
      {/* Fond à points */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgb(255 255 255 / 0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />

      {/* Halo */}
      <div
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold">EduAI</span>
        </div>

        <div className="mt-auto space-y-6">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Rejoignez la communauté des enseignants augmentés.
            </h2>
            <p className="mt-3 max-w-sm text-white/70">
              Transformez vos supports en examens intelligents, corrigés et
              analysés en quelques minutes.
            </p>
          </div>

          <ul className="space-y-3">
            {benefits.map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.text}
                  className="hero-item flex items-center gap-3 text-sm"
                  style={{ "--d": `${200 + index * 120}ms` }}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
                    <Icon className="size-4 text-white" />
                  </span>
                  <span className="text-white/85">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative z-10 mt-10 flex items-center gap-2 text-xs text-white/60">
          <GraduationCap className="size-4" />
          Plus de 2 400 enseignants nous font déjà confiance.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PASSWORD STRENGTH BAR
   ========================================================= */

function PasswordStrengthBar({ password }) {
  const { score, label, color } = useMemo(
    () => computePasswordStrength(password),
    [password]
  );

  return (
    <div
      className="mt-2 space-y-1.5"
      role="status"
      aria-label={`Force du mot de passe : ${label}`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Sécurité</span>
        <span className="font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              level <= score ? color : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   FORMULAIRE
   ========================================================= */

export default function Inscription() {
  // États contrôlés
  const [role, setRole] = useState("enseignant");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  // Erreurs : une par champ + une globale
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const controllerRef = useRef(null);

  // Annulation de la requête en cours si l'utilisateur quitte la page
  useEffect(
    () => () => controllerRef.current?.abort(),
    []
  );

  function validate(values) {
    const newErrors = {};
    if (!values.firstName?.trim()) newErrors.firstName = "Prénom requis.";
    if (!values.lastName?.trim()) newErrors.lastName = "Nom requis.";
    if (!values.email?.trim()) {
      newErrors.email = "Adresse e-mail requise.";
    } else if (!EMAIL_RE.test(values.email)) {
      newErrors.email = "Format d'adresse e-mail invalide.";
    }
    if (!values.password) {
      newErrors.password = "Mot de passe requis.";
    } else if (values.password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    }
    return newErrors;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Annule une éventuelle requête précédente
    controllerRef.current?.abort();

    const formData = new FormData(event.currentTarget);
    const values = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGlobalError("Veuillez corriger les champs en surbrillance.");
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    setSubmitting(true);
    setGlobalError("");

    try {
      await registerUser(
        {
          ...values,
          role: role === "enseignant" ? "TEACHER" : "STUDENT",
        },
        controller.signal
      );
      setSuccess(true);
    } catch (err) {
      if (err?.name === "AbortError") {
        setGlobalError(
          "La requête a expiré. Vérifiez votre connexion, puis réessayez."
        );
      } else if (err?.status === 409) {
        setGlobalError("");
        setErrors((prev) => ({
          ...prev,
          email: "Cette adresse e-mail est déjà utilisée.",
        }));
      } else if (err?.status && err.status >= 500) {
        setGlobalError(
          "Une erreur inattendue est survenue côté serveur. Merci de réessayer."
        );
      } else if (err?.name === "TypeError") {
        setGlobalError(
          "Impossible de contacter le serveur. Vérifiez votre connexion."
        );
      } else {
        setGlobalError(
          "Une erreur inattendue est survenue. Merci de réessayer."
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  // Affichage d'un champ avec gestion d'erreur
  function fieldError(name) {
    const error = errors[name];
    return error ? (
      <p
        role="alert"
        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error"
      >
        <AlertTriangle className="size-3.5 shrink-0" />
        {error}
      </p>
    ) : null;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="grid w-full max-w-[1120px] gap-8 lg:grid-cols-[1fr_480px]">
        {/* Intro latérale */}
        <SignUpHero />

        <div className="w-full">
          {/* Logo */}
          <Link to="/" className="mb-8 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              EduAI
            </span>
          </Link>

          {/* État de succès */}
          {success ? (
            <div className="card-surface animate-pop p-8 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
                <CheckCircle2 className="size-7" />
              </span>

              <h1 className="mt-5 font-display text-2xl font-semibold">
                Compte créé avec succès
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Un e-mail de vérification vient d'être envoyé à{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Cliquez sur le lien qu'il contient pour activer votre compte.
              </p>

              <div className="mt-8 flex flex-col gap-2">
                <Button asChild className="w-full rounded-xl">
                  <Link to="/connexion">
                    Passer à la connexion
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSuccess(false);
                    setPassword("");
                    setEmail("");
                  }}
                  className="w-full rounded-xl"
                >
                  Créer un autre compte
                </Button>
              </div>
            </div>
          ) : (
            <div className="card-surface animate-pop p-8">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Créer un compte
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Un e-mail de vérification vous sera envoyé.
              </p>

              {/* Erreur globale (réseau, conflit non ciblé, etc.) */}
              {globalError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>{getErrorMessage(globalError)}</p>
                </div>
              )}

              <form
                className="mt-6 space-y-5"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      autoComplete="given-name"
                      required
                      aria-invalid={!!errors.firstName}
                      aria-describedby={
                        errors.firstName ? "err-firstName" : undefined
                      }
                    />
                    {fieldError("firstName")}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      autoComplete="family-name"
                      required
                      aria-invalid={!!errors.lastName}
                      aria-describedby={
                        errors.lastName ? "err-lastName" : undefined
                      }
                    />
                    {fieldError("lastName")}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "err-email" : undefined}
                  />
                  {fieldError("email")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>

                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!errors.password}
                      aria-describedby="password-hint"
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <PasswordStrengthBar password={password} />
                  {fieldError("password")}

                  <p
                    id="password-hint"
                    className="text-xs text-muted-foreground"
                  >
                    {MIN_PASSWORD_LENGTH} caractères minimum — combinez
                    majuscules, chiffres et symboles pour plus de sécurité.
                  </p>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Je suis</legend>

                  <RadioGroup
                    value={role}
                    onValueChange={setRole}
                    className="grid grid-cols-2 gap-3"
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-all ${
                        role === "enseignant"
                          ? "border-primary bg-primary-soft text-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="enseignant" id="enseignant" />
                      <Upload className="size-4 text-primary" />
                      Enseignant
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-all ${
                        role === "etudiant"
                          ? "border-primary bg-primary-soft text-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="etudiant" id="etudiant" />
                      <GraduationCap className="size-4 text-primary" />
                      Étudiant
                    </label>
                  </RadioGroup>
                </fieldset>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Création en cours…
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                <p className="pt-2 text-center text-xs leading-relaxed text-muted-foreground">
                  En créant un compte, vous acceptez nos{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    conditions
                  </a>{" "}
                  et notre{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/connexion" className="font-medium text-primary">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}