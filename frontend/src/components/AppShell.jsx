import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleUser,
  FileBarChart,
  Info,
  Loader2,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import educaiLogo from "../assets/educai-logo.png";
import { Badge } from "./ui/Badge";
import { getCurrentUserName, readSession } from "@/utils/session";
import apiFetch from "@/utils/api";
import AssistantWidget from "./AssistantWidget";

/* =========================================================
   NAVIGATION DE L'ESPACE ADMINISTRATEUR (outline)
   ========================================================= */

export const adminNav = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/rapports", label: "Rapports", icon: FileBarChart },
  { to: "/admin/assistant", label: "Assistant IA", icon: Search },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/annonces", label: "Annonces", icon: Megaphone },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings },
  { to: "/admin/profil", label: "Profil", icon: CircleUser },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const NOTIFICATIONS = [
  {
    icon: CheckCircle2,
    tone: "text-success bg-success-soft",
    text: "Examen « Droit L2 » publié par Claire Moreau.",
    time: "il y a 5 min",
  },
  {
    icon: Info,
    tone: "text-primary bg-primary-soft",
    text: "Nouveau compte enseignant en attente de validation.",
    time: "il y a 22 min",
  },
  {
    icon: AlertTriangle,
    tone: "text-error bg-error-soft",
    text: "Import CSV étudiants : 3 lignes rejetées.",
    time: "il y a 1 h",
  },
];

/* =========================================================
   CONTENU DE LA SIDEBAR (partagé desktop / mobile)
   ========================================================= */

function SidebarContent({ nav, role, userName, onNavigate }) {
  const { pathname } = useLocation();
  const organizationName = readSession().user?.organizationName || readSession().user?.organization?.name;

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <img src={educaiLogo} alt="EduAI" className="h-11 w-20 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-tight text-white">
            EduAI
          </p>
          <p className="truncate text-xs text-white/60">{organizationName || "Espace EduAI"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label="Navigation administrateur"
      >
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? pathname === item.to
            : pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Utilisateur connecté */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {getInitials(userName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-white/60">{capitalize(role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CLOCHES DE NOTIFICATIONS
   ========================================================= */

function formatNotificationTime(value) {
  if (!value) return "Date inconnue";
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}

function formatExactDate(value) {
  if (!value) return "Date non définie";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const role = String(readSession().user?.role || "").toUpperCase();

  useEffect(() => {
    if (role !== "STUDENT") return undefined;
    let active = true;
    const loadStudentNotifications = async () => {
      setLoading(true);
      try {
        const [courseResponse, examResponse, attemptResponse, notificationResponse] = await Promise.all([
          apiFetch("/courses"),
          apiFetch("/exams"),
          apiFetch("/exam-attempts/my-attempts"),
          apiFetch("/auth/student/notifications"),
        ]);
        const courses = courseResponse.data ?? [];
        const exams = examResponse.data ?? [];
        const attempts = attemptResponse.data ?? [];
        const absenceNotifications = notificationResponse.data?.data ?? [];
        const events = [
          ...absenceNotifications.map((notification) => ({
            id: `audit-${notification.id}`,
            text: "Absence à un examen",
            detail: notification.description,
            date: notification.createdAt,
            type: "warning",
            auditId: notification.id,
          })),
          ...courses.map((course) => ({
            id: `student-course-${course.id}-${course.updatedAt || course.createdAt}`,
            text: `Vous êtes inscrit au cours « ${course.name} »`,
            date: course.createdAt,
            type: "info",
          })),
          ...exams.map((exam) => ({
            id: `student-exam-${exam.id}-${exam.updatedAt || exam.createdAt}`,
            text: `Examen ${exam.title} pour ${exam.targetProgram} ${exam.targetLevel}`,
            detail: `Date de l'examen : ${formatExactDate(exam.startDate)}`,
            date: exam.updatedAt || exam.createdAt,
            type: "success",
          })),
          ...attempts.map((attempt) => ({
            id: `student-attempt-${attempt.id}-${attempt.status}`,
            text: attempt.status === "GRADED"
              ? `Résultat disponible : ${attempt.exam?.title || "examen"}`
              : attempt.status === "SUBMITTED"
                ? `Examen soumis : ${attempt.exam?.title || "examen"}`
                : `Tentative en cours : ${attempt.exam?.title || "examen"}`,
            date: attempt.submittedAt || attempt.updatedAt || attempt.createdAt,
            type: attempt.status === "GRADED" ? "success" : "info",
          })),
        ];
        const dismissed = JSON.parse(localStorage.getItem("educai_student_read_notifications") || "[]");
        if (active) setNotifications(events.filter((event) => !dismissed.includes(event.id)).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8));
      } catch (error) {
        if (active) setNotifications([]);
        console.error("Erreur lors du chargement des notifications étudiant:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStudentNotifications();
    const refreshId = window.setInterval(loadStudentNotifications, 60000);
    return () => { active = false; window.clearInterval(refreshId); };
  }, [role]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dismissNotification = (notificationId) => {
    const dismissed = JSON.parse(localStorage.getItem("educai_student_read_notifications") || "[]");
    localStorage.setItem("educai_student_read_notifications", JSON.stringify([...new Set([...dismissed, notificationId])].slice(-100)));
    setNotifications((current) => current.filter(({ id }) => id !== notificationId));
    const auditId = notifications.find((notification) => notification.id === notificationId)?.auditId;
    if (auditId) apiFetch(`/auth/student/notifications/${auditId}/read`, { method: "PATCH" }).catch(() => {});
  };

  const dismissAll = () => {
    const dismissed = JSON.parse(localStorage.getItem("educai_student_read_notifications") || "[]");
    localStorage.setItem("educai_student_read_notifications", JSON.stringify([...new Set([...dismissed, ...notifications.map(({ id }) => id)])].slice(-100)));
    setNotifications([]);
  };

  const displayedNotifications = role === "STUDENT" ? notifications : NOTIFICATIONS;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {((role === "STUDENT" && notifications.length > 0) || role !== "STUDENT") && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-error ring-2 ring-card" />}
      </button>

      {open && (
        <div className="card-surface absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden shadow-lg animate-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <Badge className="border-transparent bg-primary-soft text-primary">
              {loading ? "..." : `${displayedNotifications.length} nouvelle${displayedNotifications.length > 1 ? "s" : ""}`}
            </Badge>
            {role === "STUDENT" && notifications.length > 0 && <button type="button" onClick={dismissAll} className="text-xs font-medium text-primary">Tout lire</button>}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading && role === "STUDENT" ? <li className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Chargement...</li> : displayedNotifications.length === 0 ? <li className="p-8 text-center text-sm text-muted-foreground">Aucune notification</li> : displayedNotifications.map((n) => {
              const Icon = n.icon || (n.type === "success" ? CheckCircle2 : n.type === "warning" ? AlertTriangle : Info);
              const tone = n.tone || (n.type === "success" ? "text-success bg-success-soft" : n.type === "warning" ? "text-error bg-error-soft" : "text-primary bg-primary-soft");
              return (
                <li key={n.id || n.text}>
                  <button
                    type="button"
                    onClick={() => role === "STUDENT" && dismissNotification(n.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${tone}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm leading-snug">{n.text}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {n.time || formatNotificationTime(n.date)}
                      </span>
                      {n.detail && <span className="block text-xs font-medium text-primary">{n.detail}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APP SHELL — SIDEBAR + TOPBAR + CONTENU
   ========================================================= */

export function AppShell({
  nav = adminNav,
  role = "administrateur",
  userName = "",
  title,
  subtitle,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef(null);
  const sessionUserName = getCurrentUserName(readSession().user);
  const resolvedUserName = userName || sessionUserName;

  // Raccourci clavier « / » pour focus la recherche
  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName;
      if (event.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Verrouille le scroll quand le drawer mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Ferme le drawer avec Escape
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-muted/50 text-foreground">
      {/* ===== Sidebar desktop ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-primary-deep lg:block">
        <SidebarContent nav={nav} role={role} userName={resolvedUserName} />
      </aside>

      {/* ===== Drawer mobile ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-pop absolute inset-y-0 left-0 w-72 bg-primary-deep shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              nav={nav}
              role={role}
              userName={resolvedUserName}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ===== Colonne principale ===== */}
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground lg:hidden"
              >
                <Menu className="size-5" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Recherche */}
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Rechercher…"
                  aria-label="Rechercher"
                  className="h-10 w-56 rounded-full border border-border bg-muted/70 pl-10 pr-4 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring xl:w-72"
                />
              </div>

              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px] space-y-6">{children}</div>
        </main>
      </div>

      <AssistantWidget />
    </div>
  );
}
