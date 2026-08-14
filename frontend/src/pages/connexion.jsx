import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import apiFetch from "@/utils/api";

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Simulation d'appel API — à remplacer par votre endpoint réel :
 *   const res = await fetch("/api/auth/login", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(payload),
 *     signal,
 *   });
 *   if (res.status === 401) {
 *     const err = new Error("INVALID_CREDENTIALS");
 *     err.status = 401;
 *     throw err;
 *   }
 *   if (!res.ok) {
 *     const err = new Error("SERVER_ERROR");
 *     err.status = res.status;
 *     throw err;
 *   }
 *   return res.json(); // { token, user, role }
 */
async function loginUser(payload, signal) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: payload,
    signal,
    credentials: "same-origin",
  });
}

function mapAuthError(error) {
  if (!error) return "";
  if (error === "AbortError") {
    return "La requête a expiré. Vérifiez votre connexion, puis réessayez.";
  }
  if (error === "INVALID_CREDENTIALS") {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (error === "ACCOUNT_LOCKED") {
    return "Trop de tentatives. Réessayez dans 15 minutes.";
  }
  if (error === "EMAIL_NOT_VERIFIED") {
    return "Veuillez d'abord vérifier votre adresse e-mail.";
  }
  if (error === "NETWORK") {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }
  return "Une erreur inattendue est survenue. Merci de réessayer.";
}

/* =========================================================
   HERO LATÉRAL (intro connexion)
   ========================================================= */

function SignInHero() {
  const benefits = [
    {
      icon: FileText,
      text: "Retrouvez tous vos examens, supports et rapports en un clic.",
    },
    {
      icon: Sparkles,
      text: "Accédez à l'IA pédagogique pour générer de nouveaux sujets.",
    },
    {
      icon: ShieldCheck,
      text: "Session sécurisée, compatible authentification à deux facteurs.",
    },
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

      {/* Halos */}
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
              Content de vous revoir.
            </h2>
            <p className="mt-3 max-w-sm text-white/70">
              Retrouvez vos examens en cours, vos dernières corrections et vos
              rapports pédagogiques en quelques secondes.
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

          {/* Carte "témoignage" */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm leading-relaxed text-white/85">
              « EduAI m'a fait gagner un après-midi entier par semaine sur la
              préparation des partiels. »
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                ML
              </span>
              <div>
                <p className="text-sm font-medium">Marie Laurent</p>
                <p className="text-xs text-white/60">
                  Professeure de droit, Université de Lyon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE DE CONNEXION
   ========================================================= */

export default function Connexion() {
  const navigate = useNavigate();

  // États du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // États UX
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AbortController : annule la requête si l'utilisateur quitte la page
  const controllerRef = useRef(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  function validate(values) {
    const newErrors = {};
    if (!values.email?.trim()) {
      newErrors.email = "Adresse e-mail requise.";
    } else if (!EMAIL_RE.test(values.email)) {
      newErrors.email = "Format d'adresse e-mail invalide.";
    }
    if (!values.password) {
      newErrors.password = "Mot de passe requis.";
    }
    return newErrors;
  }

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    controllerRef.current?.abort();

    const values = { email, password, remember };
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
      const result = await loginUser(
        { email, password, remember },
        controller.signal
      );

      // TODO : stocker le token, mettre à jour le contexte d'auth…
      console.log("[EduAI] Login success", result);

      // Redirection selon le rôle
      const redirect =
        result.role === "TEACHER"
          ? "/enseignant"
          : result.role === "STUDENT"
            ? "/etudiant"
            : "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err?.name === "AbortError") {
        setGlobalError(
          "La requête a expiré. Vérifiez votre connexion, puis réessayez."
        );
      } else if (err?.status === 401) {
        setGlobalError("");
        // Message générique pour éviter l'énumération d'emails
        setErrors({ password: "Adresse e-mail ou mot de passe incorrect." });
      } else if (err?.status === 423 || err?.status === 429) {
        setGlobalError("");
        setErrors({
          password: "Trop de tentatives. Réessayez dans 15 minutes.",
        });
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="grid w-full max-w-[1120px] gap-8 lg:grid-cols-[1fr_480px]">
        <SignInHero />

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

          <div className="card-surface animate-pop p-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ravi de vous revoir. Connectez-vous à votre espace EduAI.
            </p>

            {/* Erreur globale */}
            {globalError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{mapAuthError(globalError)}</p>
              </div>
            )}

            <form
              className="mt-6 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                    className="pl-10"
                    placeholder="vous@universite.fr"
                  />
                </div>
                {fieldError("email")}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link
                    to="/mot-de-passe-oublie"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "err-password" : undefined
                    }
                    className="pr-10"
                    placeholder="••••••••"
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
                {fieldError("password")}
              </div>

              {/* Se souvenir de moi */}
              <label
                htmlFor="remember"
                className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"
              >
                <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer absolute inset-0 cursor-pointer opacity-0"
                  />
                  <span className="grid size-5 place-items-center rounded-md border border-border bg-background transition-all peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40">
                    {remember && <CheckCircle2 className="size-3.5 text-white" />}
                  </span>
                </span>
                Rester connecté sur cet appareil
              </label>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="group w-full rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Se connecter
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              {/* Séparateur "OU" */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">
                    ou continuer avec
                  </span>
                </div>
              </div>

              {/* Boutons sociaux */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  onClick={() =>
                    console.log("[EduAI] OAuth Google — à implémenter")
                  }
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  onClick={() =>
                    console.log("[EduAI] OAuth Microsoft — à implémenter")
                  }
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 23 23"
                    aria-hidden="true"
                  >
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#7fba00" d="M12 1h10v10H12z" />
                    <path fill="#00a4ef" d="M1 12h10v10H1z" />
                    <path fill="#ffb900" d="M12 12h10v10H12z" />
                  </svg>
                  Microsoft
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Vous n'avez pas encore de compte ?{" "}
            <Link
              to="/inscription"
              className="font-medium text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}