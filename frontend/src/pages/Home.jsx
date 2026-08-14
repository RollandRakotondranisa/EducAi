import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  GraduationCap,
  ListChecks,
  Loader2,
  Mail,
  Menu,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/* =========================================================
   DONNÉES
   ========================================================= */

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#parcours", label: "Parcours" },
  { href: "#espaces", label: "Espaces" },
];

const SUBJECTS = [
  "Mathématiques",
  "Droit",
  "Médecine",
  "Informatique",
  "Économie",
  "Langues",
  "Sciences de l'ingénieur",
  "Histoire",
  "Chimie",
  "Management",
];

const PIPELINE_STEPS = [
  { icon: Upload, label: "Dépôt du document", detail: "cours_chapitre_04.pdf · 2,3 Mo" },
  { icon: ScanText, label: "Analyse IA du support", detail: "OCR, segmentation, concepts clés" },
  { icon: ListChecks, label: "Génération des questions", detail: "12 QCM · 3 questions ouvertes" },
  { icon: CheckCircle2, label: "Examen prêt à publier", detail: "Validation enseignant · confiance 96 %" },
];

const JOURNEY_STEPS = [
  { title: "Dépôt du document", text: "PDF, Word ou slides, en un simple glisser-déposer." },
  { title: "Analyse par IA", text: "OCR et extraction des notions essentielles du cours." },
  { title: "Génération des questions", text: "QCM et questions ouvertes adaptés au niveau visé." },
  { title: "Validation enseignant", text: "Vous gardez la main sur chaque question générée." },
  { title: "Publication de l'examen", text: "Mise en ligne ou export papier en un clic." },
  { title: "Correction & notes", text: "Notation instantanée et feedback par étudiant." },
];

const SPACES = [
  {
    title: "Enseignant",
    to: "/enseignant",
    icon: Upload,
    featured: true,
    text: "Déposez vos supports, laissez l'IA préparer les sujets, validez puis publiez en quelques minutes.",
    points: [
      "Dépôt et analyse de documents",
      "Éditeur de questions avec validation",
      "Suivi des examens et des notes",
    ],
  },
  {
    title: "Étudiant",
    to: "/etudiant",
    icon: GraduationCap,
    text: "Passez vos examens en ligne et comprenez vos résultats grâce à un feedback individualisé.",
    points: [
      "Examens à venir et historique",
      "Passage en ligne sécurisé",
      "Résultats détaillés et feedback IA",
    ],
  },
  {
    title: "Administrateur",
    to: "/admin",
    icon: ShieldCheck,
    text: "Pilotez la plateforme : comptes, rôles, activité et sécurité, avec des rapports complets.",
    points: [
      "Utilisateurs, rôles et permissions",
      "Journal d'activité et rapports",
      "Sécurité et conformité RGPD",
    ],
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const nf = new Intl.NumberFormat("fr-FR");

/* =========================================================
   HOOKS
   ========================================================= */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Fallback navigateurs anciens : on affiche directement.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px", ...options }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

function useCountUp(target, start, reducedMotion, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    if (reducedMotion) {
      setValue(target);
      return undefined;
    }

    let rafId = 0;
    const t0 = performance.now();

    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [start, target, reducedMotion, duration]);

  return value;
}

/* =========================================================
   WRAPPER D'ANIMATION AU SCROLL
   ========================================================= */

function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...props }) {
  const [ref, inView] = useInView();

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { "--reveal-delay": `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* =========================================================
   GESTION DES ERREURS (Error Boundary)
   ========================================================= */

function ErrorFallback({ error, onRetry }) {
  // Adapter selon votre bundler (ici : Vite).
  const isDev = import.meta.env?.DEV;

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4" role="alert">
      <div className="card-surface w-full max-w-md p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-error-soft text-error">
          <AlertTriangle className="size-6" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-semibold">
          Une erreur est survenue
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La page n'a pas pu s'afficher correctement. Essayez de recharger
          le module — vos données ne sont pas perdues.
        </p>

        {isDev && error?.message ? (
          <code className="mt-4 block overflow-auto rounded-lg bg-muted px-3 py-2 text-left text-xs text-error">
            {error.message}
          </code>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry} className="rounded-xl">
            <RotateCcw className="size-4" />
            Réessayer
          </Button>

          <Button asChild variant="ghost" className="rounded-xl">
            <a href="/">Recharger la page</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Branchez ici votre outil de monitoring (Sentry, LogRocket…).
    console.error("[EduAI] Erreur interceptée :", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

/* =========================================================
   HEADER (progress bar de scroll + menu mobile)
   ========================================================= */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const onScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const el = document.documentElement;
        setScrolled(el.scrollTop > 8);
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.min(el.scrollTop / max, 1) : 0);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-all duration-300 ${
        scrolled
          ? "border-border bg-card/90 shadow-sm"
          : "border-transparent bg-card/60"
      }`}
    >
      {/* Barre de progression de lecture */}
      <span
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-primary transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="EduAI — accueil">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            EduAI
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden rounded-xl sm:inline-flex">
            <Link to="/connexion">Connexion</Link>
          </Button>

          <Button asChild className="rounded-xl">
            <Link to="/inscription">Créer un compte</Link>
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            className="grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground md:hidden"
          >
            <span className="sr-only">
              {menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            </span>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="menu-mobile" className="animate-pop border-t border-border bg-card md:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col px-4 py-4 sm:px-8" aria-label="Navigation mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Button asChild variant="ghost">
                <Link to="/connexion" onClick={() => setMenuOpen(false)}>
                  Connexion
                </Link>
              </Button>
              <Button asChild>
                <Link to="/inscription" onClick={() => setMenuOpen(false)}>
                  Créer un compte
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* =========================================================
   HERO — PIPELINE ANIMÉ
   ========================================================= */

function HeroPipeline({ reducedMotion }) {
  const total = PIPELINE_STEPS.length;
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setStep(total);
      return undefined;
    }
    const id = window.setInterval(() => {
      // +2 : marque une pause sur l'état « terminé » avant de reboucler.
      setStep((s) => (s + 1) % (total + 2));
    }, 1500);
    return () => window.clearInterval(id);
  }, [reducedMotion, total]);

  const isDone = step >= total;
  const progress = Math.min(step / total, 1) * 100;
  const currentLabel = PIPELINE_STEPS[Math.min(step, total - 1)].label;

  return (
    <div className="relative">
      {/* Badges flottants */}
      <div className="animate-float absolute -top-6 right-0 z-10 sm:-right-4">
        <div className="card-surface flex items-center gap-2 px-3.5 py-2 text-xs font-medium shadow-md">
          <Sparkles className="size-3.5 text-primary" />
          Confiance moyenne :
          <span className="font-semibold text-success">96 %</span>
        </div>
      </div>

      <div className="animate-float-slow absolute -bottom-6 left-0 z-10 sm:-left-4">
        <div className="card-surface flex items-center gap-2 px-3.5 py-2 text-xs font-medium shadow-md">
          <CheckCircle2 className="size-3.5 text-success" />
          38 copies corrigées en 12 s
        </div>
      </div>

      {/* Carte principale */}
      <div className="card-surface overflow-hidden shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-5 py-3">
          <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileText className="size-4 shrink-0 text-primary" />
            <span className="truncate">cours_chapitre_04.pdf</span>
          </p>
          <Badge className="shrink-0 border-transparent bg-primary-soft text-primary">
            Analyse en direct
          </Badge>
        </div>

        {/* Progression */}
        <div className="h-1 w-full bg-border/60">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="space-y-1 p-4 sm:p-5">
          {PIPELINE_STEPS.map((item, index) => {
            const Icon = item.icon;
            const done = step > index;
            const active = step === index;

            return (
              <li
                key={item.label}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                  active ? "bg-primary-soft/70" : ""
                }`}
              >
                <span
                  className={`relative grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                    done
                      ? "border-success/30 bg-success-soft text-success"
                      : active
                        ? "step-active border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="animate-pop size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done || active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Statut */}
        <div className="border-t border-border bg-muted/40 px-5 py-3 text-xs">
          {isDone ? (
            <p key="done" className="animate-pop flex items-center gap-2 font-medium text-success">
              <CheckCircle2 className="size-4" />
              Examen prêt — 15 questions générées, confiance moyenne 96 %.
            </p>
          ) : (
            <p key={step} className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              {currentLabel}…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATISTIQUES (compteurs animés)
   ========================================================= */

function Stat({ target, suffix, label, inView, reducedMotion }) {
  const value = useCountUp(target, inView, reducedMotion);

  return (
    <div className="text-center">
      <p className="font-display text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
        {nf.format(value)}
        <span className="text-2xl sm:text-3xl">{suffix}</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatsBand({ reducedMotion }) {
  const [ref, inView] = useInView({ threshold: 0.35 });

  const stats = [
    { target: 12400, suffix: "", label: "documents analysés" },
    { target: 89, suffix: " %", label: "taux de réussite moyen" },
    { target: 4, suffix: " min", label: "pour créer un examen" },
  ];

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "is-visible" : ""} glass-panel grid gap-8 p-8 sm:grid-cols-3`}
    >
      {stats.map((stat) => (
        <Stat
          key={stat.label}
          {...stat}
          inView={inView}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

/* =========================================================
   MARQUEE MATIÈRES
   ========================================================= */

function SubjectsMarquee() {
  return (
    <section
      className="marquee overflow-hidden border-b border-border bg-card py-5"
      aria-label="Matières prises en charge"
    >
      <p className="sr-only">
        Compatible avec toutes les matières : {SUBJECTS.join(", ")}.
      </p>

      <div className="marquee-track flex w-max" aria-hidden="true">
        {[...SUBJECTS, ...SUBJECTS].map((subject, index) => (
          <span
            key={`${subject}-${index}`}
            className="flex items-center gap-3 pr-10 text-sm font-medium text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary/50" />
            {subject}
          </span>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   FONCTIONNALITÉS (bento + mini-démos)
   ========================================================= */

function FeatureCard({ icon: Icon, title, text, badge, children }) {
  return (
    <article className="card-surface group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon className="size-5" />
        </span>
        {badge ? (
          <Badge className="border-transparent bg-primary-soft text-primary">
            {badge}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>

      {children}
    </article>
  );
}

function FeatureAnalyseDemo() {
  const chips = [
    { icon: Sparkles, label: "Concept : révolution industrielle" },
    { icon: FileText, label: "Mot-clé : machine à vapeur" },
    { icon: CheckCircle2, label: "Date clé : 1848" },
  ];

  return (
    <div className="mt-6 grid flex-1 items-center gap-5 rounded-2xl border border-border bg-muted/50 p-5 sm:grid-cols-[1.1fr_1fr]">
      {/* Document scanné */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="space-y-2.5" aria-hidden="true">
          <div className="h-2.5 w-1/2 rounded-full bg-primary/20" />
          <div className="h-2 w-full rounded-full bg-border" />
          <div className="h-2 w-11/12 rounded-full bg-border" />
          <div className="h-2 w-full rounded-full bg-border" />
          <div className="h-2 w-4/5 rounded-full bg-border" />
          <div className="h-2.5 w-2/5 rounded-full bg-primary/20" />
          <div className="h-2 w-full rounded-full bg-border" />
          <div className="h-2 w-10/12 rounded-full bg-border" />
        </div>
        <span className="scan-line" aria-hidden="true" />
      </div>

      {/* Concepts extraits */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Concepts extraits
        </p>
        {chips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <span
              key={chip.label}
              className="chip-pop flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium shadow-sm"
              style={{ "--d": `${400 + index * 350}ms` }}
            >
              <Icon className="size-3.5 text-primary" />
              {chip.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FeatureGenerationDemo() {
  return (
    <div className="mt-6 flex-1 rounded-2xl border border-border bg-muted/50 p-5">
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Exemple généré
        </p>
        <p className="mt-1.5 text-sm font-medium leading-snug">
          Quel événement marque le début de la Révolution française ?
        </p>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2.5 rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm font-medium">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            La prise de la Bastille
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <span className="size-4 shrink-0 rounded-full border-2 border-border" />
            Le Congrès de Vienne
          </div>
        </div>
      </div>

      <Badge className="mt-3 border-transparent bg-primary-soft text-primary">
        <Sparkles className="size-3" />
        Confiance IA : 96 %
      </Badge>
    </div>
  );
}

function FeatureCorrectionDemo() {
  return (
    <div className="mt-6 flex-1 rounded-2xl border border-border bg-muted/50 p-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Copie n° 23 · notée
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">
            14,5<span className="text-base font-medium text-muted-foreground"> / 20</span>
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-5" />
        </span>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Feedback : bonne maîtrise du chapitre 3 — revoir la méthodologie de la question 7.
      </p>
    </div>
  );
}

function FeatureAnalyticsDemo() {
  const bars = [86, 74, 91, 62, 34, 79, 88, 70];

  return (
    <div className="mt-6 grid flex-1 items-center gap-6 rounded-2xl border border-border bg-muted/50 p-5 sm:grid-cols-[1fr_1.3fr]">
      <ul className="space-y-3 text-sm leading-relaxed">
        <li className="flex gap-2.5">
          <BarChart3 className="mt-0.5 size-4 shrink-0 text-primary" />
          Taux de réussite par question et par promotion.
        </li>
        <li className="flex gap-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" />
          Détection automatique des questions trop difficiles.
        </li>
        <li className="flex gap-2.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          Rapports exportables PDF / Excel en un clic.
        </li>
      </ul>

      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <div className="flex h-28 items-end gap-2">
          {bars.map((height, index) => (
            <div key={index} className="flex h-full flex-1 items-end">
              <div
                className={`bar w-full rounded-t ${index === 4 ? "bg-error/80" : "bg-primary/85"}`}
                style={{ height: `${height}%`, "--d": `${index * 90}ms` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {bars.map((_, index) => (
            <span
              key={index}
              className={`flex-1 text-center text-[10px] font-medium ${
                index === 4 ? "text-error" : "text-muted-foreground"
              }`}
            >
              Q{index + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ESPACES
   ========================================================= */

function SpaceCard({ space, delay }) {
  const { title, to, icon: Icon, text, points, featured } = space;

  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={to}
        className={`group flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1.5 sm:p-8 ${
          featured
            ? "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            : "card-surface hover:shadow-lg"
        }`}
      >
        <span
          className={`grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
            featured ? "bg-white/15 text-white" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon className="size-5" />
        </span>

        <h3 className="mt-5 font-display text-xl font-semibold">
          Espace {title}
        </h3>

        <p
          className={`mt-2 text-sm leading-relaxed ${
            featured ? "text-white/75" : "text-muted-foreground"
          }`}
        >
          {text}
        </p>

        <ul className="mt-5 space-y-2.5 text-sm">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2.5">
              <CheckCircle2
                className={`size-4 shrink-0 ${featured ? "text-white/80" : "text-success"}`}
              />
              <span className={featured ? "text-white/90" : ""}>{point}</span>
            </li>
          ))}
        </ul>

        <span
          className={`mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold ${
            featured ? "text-white" : "text-primary"
          }`}
        >
          Accéder à l'espace
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </span>
      </Link>
    </Reveal>
  );
}

/* =========================================================
   NEWSLETTER (validation + timeout + gestion d'erreur)
   ========================================================= */

/**
 * Simulation d'appel API. À remplacer par votre endpoint réel :
 * fetch("/api/newsletter", { method: "POST", signal, body: JSON.stringify({ email }) })
 */
function subscribeToNewsletter(email, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve({ ok: true, email }), 900);

    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      const err = new Error("Requête annulée");
      err.name = "AbortError";
      reject(err);
    });
  });
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const controllerRef = useRef(null);

  // Annule toute requête en cours si le composant est démonté.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const loading = status === "loading";
  const error = status === "error";
  const success = status === "success";

  async function handleSubmit(event) {
    event.preventDefault();
    controllerRef.current?.abort();

    const value = email.trim();

    // Validation côté client avant tout appel réseau.
    if (!value) {
      setStatus("error");
      setMessage("Veuillez saisir votre adresse e-mail.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("Cette adresse e-mail semble invalide.");
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    setStatus("loading");
    setMessage("");

    try {
      await subscribeToNewsletter(value, controller.signal);
      setStatus("success");
      setMessage("Inscription confirmée. À très vite !");
      setEmail("");
    } catch (err) {
      if (err?.name === "AbortError") {
        setStatus("error");
        setMessage("La requête a expiré. Vérifiez votre connexion, puis réessayez.");
      } else {
        setStatus("error");
        setMessage("Une erreur inattendue est survenue. Merci de réessayer.");
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Adresse e-mail
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            aria-invalid={error}
            aria-describedby="newsletter-status"
            placeholder="vous@universite.fr"
            className="input-field pl-10"
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setMessage("");
              }
            }}
          />
        </div>

        <Button type="submit" disabled={loading} className="shrink-0 rounded-xl">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Envoi…
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>
      </div>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`mt-2.5 flex min-h-5 items-center gap-1.5 text-xs font-medium ${
          error ? "text-error" : success ? "text-success" : "text-muted-foreground"
        }`}
      >
        {error && <AlertTriangle className="size-3.5 shrink-0" />}
        {success && <CheckCircle2 className="size-3.5 shrink-0" />}
        {message}
      </p>
    </form>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */

function FooterCol({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.label}>
            {link.to ? (
              <Link to={link.to} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ) : (
              <a href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.3fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="font-display text-lg font-semibold">EduAI</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              La plateforme qui transforme vos supports de cours en évaluations
              intelligentes, corrigées et analysées.
            </p>
          </div>

          <FooterCol
            title="Navigation"
            links={NAV_LINKS.map((link) => ({ ...link }))}
          />

          <FooterCol
            title="Espaces"
            links={[
              { to: "/enseignant", label: "Espace enseignant" },
              { to: "/etudiant", label: "Espace étudiant" },
              { to: "/admin", label: "Administration" },
            ]}
          />

          <div>
            <h3 className="text-sm font-semibold">Newsletter pédagogique</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nouveautés IA et bonnes pratiques d'évaluation. Un e-mail par
              mois, pas plus.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>© 2026 EduAI — Plateforme pédagogique intelligente.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="#" className="transition-colors hover:text-foreground">
              Mentions légales
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Confidentialité
            </a>
            <Link
              to="/connexion"
              className="font-medium text-primary transition-colors hover:text-primary-deep"
            >
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

function HomePage() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#contenu" className="skip-link">
        Aller au contenu principal
      </a>

      <Header />

      <main id="contenu">
        {/* ================= HERO ================= */}
        <section className="bg-hero relative overflow-hidden">
          <div className="grid-lines absolute inset-0" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-20 lg:pt-20">
            <div>
              <Reveal>
                <Badge className="border-transparent bg-primary-soft text-primary">
                  <Sparkles className="size-3.5" />
                  Intelligence artificielle pédagogique
                </Badge>
              </Reveal>

              <Reveal delay={90}>
                <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.06] tracking-tight sm:text-5xl xl:text-[3.4rem]">
                  De vos documents de cours aux notes de vos étudiants,{" "}
                  <span className="highlight italic">automatiquement</span>.
                </h1>
              </Reveal>

              <Reveal delay={180}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  EduAI analyse vos supports, génère des évaluations adaptées,
                  corrige les copies et restitue des statistiques pédagogiques
                  exploitables.
                </p>
              </Reveal>

              <Reveal delay={260}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="group rounded-xl">
                    <Link to="/connexion">
                      Explorer l'espace enseignant
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="ghost" className="rounded-xl">
                    <a href="#parcours">Voir le parcours</a>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={340}>
                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-success" />
                    Conforme RGPD
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-success" />
                    Données hébergées en Europe
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    Validation enseignant à chaque étape
                  </span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={240} className="lg:pl-2">
              <HeroPipeline reducedMotion={reducedMotion} />
            </Reveal>
          </div>

          <div className="relative mx-auto max-w-[1200px] px-4 pb-16 sm:px-8 lg:pb-20">
            <StatsBand reducedMotion={reducedMotion} />
          </div>
        </section>

        <SubjectsMarquee />

        {/* ================= FONCTIONNALITÉS ================= */}
        <section id="fonctionnalites" className="scroll-mt-24">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8 lg:py-24">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Fonctionnalités
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Une chaîne pédagogique complète
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Quatre briques, un seul flux : vos contenus entrent, des
                évaluations corrigées et analysées ressortent.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <FeatureCard
                  icon={FileText}
                  title="Analyse documentaire"
                  text="OCR, segmentation et extraction des concepts clés de vos supports : PDF, Word, slides scannées."
                  badge="OCR + NLP"
                >
                  <FeatureAnalyseDemo />
                </FeatureCard>
              </Reveal>

              <Reveal delay={120}>
                <FeatureCard
                  icon={Sparkles}
                  title="Génération IA"
                  text="QCM, questions ouvertes et exercices adaptés au niveau visé, avec score de confiance affiché."
                  badge="Confiance affichée"
                >
                  <FeatureGenerationDemo />
                </FeatureCard>
              </Reveal>

              <Reveal>
                <FeatureCard
                  icon={ListChecks}
                  title="Correction automatique"
                  text="Notation instantanée des copies et feedback personnalisé pour chaque étudiant."
                  badge="Temps réel"
                >
                  <FeatureCorrectionDemo />
                </FeatureCard>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-2">
                <FeatureCard
                  icon={BarChart3}
                  title="Analytics pédagogiques"
                  text="Taux de réussite, analyse de difficulté et rapports exportables pour piloter vos promotions."
                  badge="PDF · Excel"
                >
                  <FeatureAnalyticsDemo />
                </FeatureCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= PARCOURS ================= */}
        <section
          id="parcours"
          className="bg-primary-deep relative scroll-mt-24 overflow-hidden text-white"
        >
          <div className="dots-dark absolute inset-0 opacity-40" aria-hidden="true" />

          <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-8 lg:py-24">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  Parcours
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Du support de cours à la note finale
                </h2>
                <p className="mt-4 leading-relaxed text-white/70">
                  Six étapes automatisées — et l'enseignant garde le contrôle à
                  chaque instant.
                </p>
              </div>

              <Link
                to="/connexion"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
              >
                Essayer maintenant
                <ArrowRight className="size-4" />
              </Link>
            </Reveal>

            <Reveal delay={150}>
              <ol className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-6 lg:gap-4">
                {JOURNEY_STEPS.map((step, index) => (
                  <li key={step.title} className="group relative">
                    {index < JOURNEY_STEPS.length - 1 && (
                      <span
                        className="timeline-line absolute -right-4 left-12 top-5 hidden h-px bg-white/20 lg:block"
                        style={{ "--d": `${index * 140}ms` }}
                        aria-hidden="true"
                      />
                    )}

                    <span className="relative z-10 grid size-10 place-items-center rounded-full border border-white/25 bg-primary-deep font-display text-sm font-semibold transition-colors duration-300 group-hover:bg-white group-hover:text-primary-deep">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ================= ESPACES ================= */}
        <section id="espaces" className="scroll-mt-24 bg-muted/60">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8 lg:py-24">
            <Reveal className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Espaces
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Trois espaces, une même exigence
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Enseignants, étudiants et administrateurs disposent chacun d'un
                environnement dédié, pensé pour leur usage.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {SPACES.map((space, index) => (
                <SpaceCard key={space.title} space={space} delay={index * 120} />
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8 lg:py-24">
          <Reveal>
            <div className="bg-primary-deep relative overflow-hidden rounded-3xl px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
              <div className="dots-dark absolute inset-0 opacity-40" aria-hidden="true" />
              <div
                className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/50 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative mx-auto max-w-2xl">
                <Badge className="border-white/20 bg-white/10 text-white">
                  <Sparkles className="size-3.5" />
                  Nouveau : correction des questions ouvertes
                </Badge>

                <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Prêt à diviser par quatre votre temps de correction ?
                </h2>

                <p className="mt-4 leading-relaxed text-white/70">
                  Rejoignez les enseignants qui créent, font passer et corrigent
                  leurs examens avec EduAI.
                </p>

                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/inscription"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary-deep shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-soft"
                  >
                    Créer un compte gratuitement
                    <ArrowRight className="size-4" />
                  </Link>

                  <Link
                    to="/connexion"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Planifier une démo
                  </Link>
                </div>

                <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Gratuit pour les enseignants
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Sans carte bancaire
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Conforme RGPD
                  </span>
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}