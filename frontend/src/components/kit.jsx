import React from "react";

/* =========================================================
   CARTE STATISTIQUE (haut du dashboard)
   ========================================================= */

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    error: "bg-error-soft text-error",
  };

  return (
    <div className="card-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tones[tone] || tones.primary}`}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* =========================================================
   CARTE DE SECTION (titres + contenu)
   ========================================================= */

export function SectionCard({ title, description, actions, children }) {
  return (
    <section className="card-surface min-w-0 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* =========================================================
   ÉTAT VIDE
   ========================================================= */

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* =========================================================
   BADGE DE STATUT (journal d'activité)
   ========================================================= */

export function StatusBadge({ status }) {
  const config = {
    valide: { label: "Validé", cls: "bg-success-soft text-success", dot: "bg-success" },
    encours: { label: "En cours", cls: "bg-primary-soft text-primary", dot: "bg-primary" },
    erreur: { label: "Erreur", cls: "bg-error-soft text-error", dot: "bg-error" },
  };
  const c = config[status] || config.encours;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}