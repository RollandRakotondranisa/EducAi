import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  FileText,
  ListChecks,
  BarChart3,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  {
    icon: FileText,
    title: "Analyse documentaire",
    text: "OCR, segmentation et extraction des concepts clés de vos supports de cours.",
  },
  {
    icon: Sparkles,
    title: "Génération IA",
    text: "QCM, questions ouvertes et exercices générés avec niveau de confiance affiché.",
  },
  {
    icon: ListChecks,
    title: "Correction automatique",
    text: "Notation instantanée des copies et feedback personnalisé pour chaque étudiant.",
  },
  {
    icon: BarChart3,
    title: "Analytics pédagogiques",
    text: "Taux de réussite, analyse de difficulté et rapports exportables PDF/Excel.",
  },
];

const steps = [
  "Dépôt du document",
  "Analyse par IA",
  "Génération des questions",
  "Validation enseignant",
  "Publication de l'examen",
  "Correction & notes",
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-8">

          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>

            <span className="text-lg font-semibold">
              EduAI
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites">
              Fonctionnalités
            </a>

            <a href="#parcours">
              Parcours
            </a>

            <a href="#espaces">
              Espaces
            </a>
          </nav>

          <div className="flex items-center gap-2">

            <Button
              asChild
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              <Link to="/connexion">
                Connexion
              </Link>
            </Button>

            <Button
              asChild
              className="rounded-xl"
            >
              <Link to="/inscription">
                Créer un compte
              </Link>
            </Button>

          </div>
        </div>
      </header>

      {/* MAIN */}
      <main>

        {/* HERO */}
        <section className="relative overflow-hidden">

          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-primary-soft),transparent)]" />

          <div className="mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-8 sm:py-28">

            <Badge className="border-transparent bg-primary-soft text-primary">
              Intelligence artificielle pédagogique
            </Badge>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              De vos documents de cours aux notes des étudiants,
              automatiquement.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              EduAI analyse vos supports, génère les évaluations,
              corrige les copies et restitue des statistiques
              pédagogiques exploitables.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">

              <Button
                asChild
                size="lg"
                className="rounded-xl"
              >
                <Link to="/connexion">
                  Explorer l'espace enseignant
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

            </div>

            {/* STATISTIQUES */}
            <div className="glass-panel mx-auto mt-16 grid max-w-4xl gap-6 p-8 sm:grid-cols-3">

              <Stat
                value="12 400"
                label="documents analysés"
              />

              <Stat
                value="89 %"
                label="taux de réussite moyen"
              />

              <Stat
                value="4 min"
                label="pour créer un examen"
              />

            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="fonctionnalites"
          className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8"
        >

          <h2 className="text-3xl font-semibold">
            Une chaîne pédagogique complète
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="card-surface p-6"
                >

                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>

                  <h3 className="mt-4 font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.text}
                  </p>

                </article>
              );
            })}

          </div>
        </section>

        {/* PARCOURS */}
        <section
          id="parcours"
          className="border-y border-border bg-card"
        >

          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8">

            <h2 className="text-3xl font-semibold">
              Le parcours enseignant
            </h2>

            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {steps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-xl bg-background p-5"
                >

                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>

                  <span className="text-sm font-medium">
                    {step}
                  </span>

                </li>
              ))}

            </ol>

          </div>
        </section>

        {/* ESPACES */}
        <section
          id="espaces"
          className="mx-auto max-w-[1200px] px-4 py-20 sm:px-8"
        >

          <h2 className="text-3xl font-semibold">
            Trois espaces dédiés
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">

            <SpaceCard
              title="Enseignant"
              to="/enseignant"
              icon={Upload}
              text="Cours, dépôt de documents, analyse IA, éditeurs de questions, examens."
            />

            <SpaceCard
              title="Étudiant"
              to="/etudiant"
              icon={CheckCircle2}
              text="Examens à venir, passage en ligne, résultats détaillés et feedback IA."
            />

            <SpaceCard
              title="Administrateur"
              to="/admin"
              icon={ShieldCheck}
              text="Utilisateurs, rôles, journal d'activité, rapports et sécurité."
            />

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card">

        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-8">

          <p>
            © 2026 EduAI — Plateforme pédagogique intelligente.
          </p>

          <Link to="/connexion">
            Connexion
          </Link>

        </div>

      </footer>

    </div>
  );
}

/* STATISTIQUE */
function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl font-semibold text-primary">
        {value}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* CARTE ESPACE */
function SpaceCard({ title, to, icon: Icon, text }) {
  return (
    <Link
      to={to}
      className="card-surface group block p-6"
    >

      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="size-5" />
      </span>

      <h3 className="mt-4 flex items-center gap-2 font-semibold">

        Espace {title}

        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />

      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        {text}
      </p>

    </Link>
  );
}