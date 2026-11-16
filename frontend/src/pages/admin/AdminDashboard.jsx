import {
  ArrowUpRight,
  BookOpen,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  RefreshCw,
  Activity,
  Calendar,
  Award,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { readSession } from "@/utils/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// === COMPOSANTS RÉUTILISABLES ===

function StatCard({ label, value, hint, icon: Icon, trend, delay = 0 }) {
  return (
    <article
      className="stat-card-pro card-surface p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="stat-value-pro mt-3 text-4xl font-bold">
            {value || "0"}
          </p>
        </div>
        <span className="stat-icon-pro grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-6 w-6" />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={`trend-icon inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend >= 0 ? "trend-up" : "trend-down"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {hint}
        </span>
      </div>
    </article>
  );
}

function BarChart({ data, maxValue }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Aucune donnée"
        description="Les nouvelles inscriptions apparaîtront ici"
      />
    );
  }

  const max = Math.max(maxValue || 0, ...data.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="bar-chart-container">
      <div className="grid h-full min-w-[28rem] grid-cols-6 gap-4">
        {data.map((item, index) => (
          <div key={item.label} className="bar-column">
            <div
              className="bar-fill gradient-primary"
              data-value={item.value}
              style={{
                height: `${Math.max(8, (item.value / max) * 100)}%`,
                background: "linear-gradient(180deg, var(--primary) 0%, var(--primary-deep) 100%)",
                animationDelay: `${index * 100}ms`,
              }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, total }) {
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="donut-chart"
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const dashLength = (percentage / 100) * circumference;
          const dashGap = circumference - dashLength;
          const offset = -currentOffset;

          currentOffset += dashLength;

          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="donut-segment"
              stroke={segment.color}
              strokeDasharray={`0 ${circumference}`}
              strokeDashoffset={offset}
              style={{
                "--dash-final": `${dashLength} ${dashGap}`,
                animationDelay: `${index * 150}ms`,
              }}
            />
          );
        })}
      </svg>

      <div className="donut-center-text absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{total}</span>
        <span className="text-xs font-medium text-muted-foreground">Total</span>
      </div>
    </div>
  );
}

function ActivityRow({ item, delay = 0 }) {
  const statusStyles = {
    Valide: "activity-dot-success",
    "En cours": "activity-dot-warning",
    Erreur: "activity-dot-primary",
  };

  return (
    <tr
      className="activity-row"
      style={{ animationDelay: `${delay}ms` }}
    >
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className={`activity-dot ${statusStyles[item.status] || "activity-dot-primary"}`}></div>
          <span className="font-semibold text-foreground">{item.user}</span>
        </div>
      </td>
      <td className="py-4 pr-4 text-muted-foreground">{item.action}</td>
      <td className="py-4 pr-4">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {item.date}
        </span>
      </td>
      <td className="py-4 text-right">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            item.status === "Valide"
              ? "bg-success-soft text-success"
              : item.status === "En cours"
              ? "bg-warning-soft text-warning"
              : "bg-error-soft text-error"
          }`}
        >
          {item.status}
        </span>
      </td>
    </tr>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-chart">
      <div className="empty-chart-icon mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-surface p-6">
      <div className="skeleton-dashboard mb-3 h-4 w-24"></div>
      <div className="skeleton-dashboard mb-4 h-10 w-20"></div>
      <div className="skeleton-dashboard h-3 w-32"></div>
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

function AdminDashboard() {
  const isSuperAdmin = Boolean(readSession().user?.isSuperAdmin);
  const [stats, setStats] = useState({
    totalUsers: 0,
    teachers: 0,
    students: 0,
    admins: 0,
    roles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = localStorage.getItem("educai_access_token");
        const response = await axios.get(`${API_BASE}/auth/admin/stats`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data?.data) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError(
          err.response?.data?.message ||
            "Impossible de charger les statistiques. Veuillez réessayer."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = useMemo(
    () => isSuperAdmin
      ? [
          {
            label: "Administrateurs acceptés",
            value: stats.admins,
            hint: "Demandes approuvées",
            icon: ShieldCheck,
            trend: 0,
          },
        ]
      : [
          {
            label: "Utilisateurs",
            value: stats.totalUsers,
            hint: "Total comptes",
            icon: Users,
            trend: 12,
          },
          {
            label: "Enseignants",
            value: stats.teachers,
            hint: "Actifs",
            icon: BookOpen,
            trend: 8,
          },
          {
            label: "Étudiants",
            value: stats.students,
            hint: "Inscrits",
            icon: Award,
            trend: 15,
          },
          {
            label: "Administrateurs",
            value: stats.admins,
            hint: "Total",
            icon: ShieldCheck,
            trend: 0,
          },
        ],
    [stats, isSuperAdmin]
  );

  const chartData = stats.monthlyUsers || [];

  const donutSegments = useMemo(() => {
    const colors = {
      Étudiants: "#0b3c5d",
      Enseignants: "#1e5a8a",
      Administrateurs: "#2e7d32",
    };

    return (stats.roles || []).map((role) => ({
      label: role.name,
      value: role.value,
      color: colors[role.name] || "#64748b",
    }));
  }, [stats.roles]);

  const totalRoles = donutSegments.reduce((sum, s) => sum + s.value, 0);

  const activity = [
    {
      user: "Système",
      action: "Tableau de bord chargé",
      date: new Date().toLocaleDateString("fr-FR"),
      status: "Valide",
    },
    {
      user: "Admin",
      action: "3 nouveaux utilisateurs ajoutés",
      date: "Aujourd'hui",
      status: "Valide",
    },
    {
      user: "Système",
      action: "Sauvegarde automatique",
      date: "Hier",
      status: "Valide",
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="card-surface max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-soft">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              Erreur de chargement
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-header">
      {/* === HEADER === */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                EduAI
              </p>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold">
              Tableau de bord administrateur
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Vue d'ensemble de votre plateforme éducative
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted hover:shadow-md">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sécurité
            </button>
            <button className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
              <ArrowUpRight className="h-4 w-4" />
              Vue d'ensemble
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* === STAT CARDS === */}
        <section className={`grid gap-6 ${isSuperAdmin ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
          {loading ? (
            isSuperAdmin ? (
              <SkeletonCard />
            ) : (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )
          ) : (
            statsCards.map((card, index) => (
              <StatCard key={card.label} {...card} delay={index * 100} />
            ))
          )}
        </section>

        {/* === CHARTS SECTION === */}
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Bar Chart */}
          <article className="card-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Nouveaux utilisateurs
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comptes créés au cours des six derniers mois
                </p>
              </div>
              <span className="trend-up inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                <TrendingUp className="h-3.5 w-3.5" />
                +18%
              </span>
            </div>

            {loading ? (
              <div className="skeleton-dashboard h-56"></div>
            ) : (
              <BarChart data={chartData} />
            )}
          </article>

          {/* Donut Chart */}
          <article className="card-surface p-6">
            <h2 className="text-lg font-semibold">Répartition des rôles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comptes actifs
            </p>

            <div className="mt-8">
              {loading ? (
                <div className="skeleton-dashboard mx-auto h-40 w-40 rounded-full"></div>
              ) : donutSegments.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aucune donnée"
                  description="Les rôles apparaîtront ici"
                />
              ) : (
                <DonutChart segments={donutSegments} total={totalRoles} />
              )}
            </div>

            {!loading && donutSegments.length > 0 && (
              <ul className="mt-8 space-y-3">
                {donutSegments.map((segment, index) => (
                  <li
                    key={segment.label}
                    className="flex items-center justify-between text-sm"
                    style={{ animationDelay: `${index * 100 + 600}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      ></span>
                      <span className="font-medium">{segment.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {segment.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        {/* === ACTIVITY TABLE === */}
        <section className="card-surface p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Journal des activités</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dernières actions sur la plateforme
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted hover:shadow-sm">
              Voir tout
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b-2 border-border-strong">
                <tr>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Utilisateur
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <div className="skeleton-dashboard mx-auto h-4 w-3/4"></div>
                    </td>
                  </tr>
                ) : (
                  activity.map((item, index) => (
                    <ActivityRow
                      key={`${item.user}-${item.date}-${index}`}
                      item={item}
                      delay={index * 80}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;