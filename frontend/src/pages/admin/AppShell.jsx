import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleUser,
  FileBarChart,
  BarChart3,
  Info,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Megaphone,
  Menu,
  Search,
  Settings,
  Moon,
  Sun,
  Users,
  X,
  ChevronRight,
  Keyboard,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/components/theme/ThemeProvider";
import educaiLogo from "../../assets/educai-logo.png";
import { readSession } from "@/utils/session";

/* =========================================================
   NAVIGATION DE L'ESPACE ADMINISTRATEUR
   ========================================================= */

export const adminNav = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/rapports", label: "Rapports", icon: FileBarChart },
  { to: "/admin/audit", label: "Audit", icon: BarChart3 },
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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatRelativeTime(dateValue) {
  if (!dateValue) return "À l'instant";

  const date = new Date(dateValue);
  const diffMinutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60000)
  );

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;

  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
}

function getNotificationStyle(action) {
  const normalized = String(action || "").toUpperCase();

  if (normalized.includes("APPROVE") || normalized.includes("LOGIN")) {
    return { icon: CheckCircle2, tone: "text-success bg-success-soft" };
  }

  if (normalized.includes("REJECT") || normalized.includes("LOGOUT")) {
    return { icon: AlertTriangle, tone: "text-error bg-error-soft" };
  }

  return { icon: Info, tone: "text-primary bg-primary-soft" };
}

/* =========================================================
   SIDEBAR CONTENT
   ========================================================= */

function SidebarContent({ nav, role, userName, onNavigate }) {
  const { pathname } = useLocation();
  const { user } = readSession();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <img src={educaiLogo} alt="EduAI" className="h-full w-full rounded-lg object-contain" />
        </div>
        <div className="sidebar-logo-text">
          <h2>EduAI</h2>
          <p>{user?.organizationName || user?.organization?.name || "EduAI"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Navigation administrateur">
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
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">
                <Icon className="size-5" />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Utilisateur connecté */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{getInitials(userName)}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{userName}</p>
            <p className="sidebar-user-role">{capitalize(role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   USER MENU
   ========================================================= */

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("educai_access_token");

      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => {});

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
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu utilisateur"
        aria-expanded={open}
        className="icon-button-pro"
      >
        <CircleUser className="size-5" />
      </button>

      {open && (
        <div className="dropdown-pro" style={{ minWidth: "200px" }}>
          <Link
            to="/admin/profil"
            onClick={() => setOpen(false)}
            className="user-menu-item"
          >
            <div className="user-menu-icon">
              <CircleUser className="size-4" />
            </div>
            <span>Mon profil</span>
            <ChevronRight className="ml-auto size-4 text-muted-foreground" />
          </Link>

          <div className="border-t border-border"></div>

          <button
            type="button"
            onClick={handleLogout}
            className="user-menu-item danger"
          >
            <div className="user-menu-icon">
              <LogOut className="size-4" />
            </div>
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   NOTIFICATION BELL
   ========================================================= */

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const accessToken = localStorage.getItem("educai_access_token");
        if (!accessToken) {
          setNotifications([]);
          return;
        }

        const [pendingRes, auditRes] = await Promise.all([
          axios.get(`${API_BASE}/auth/admin/pending-requests?page=0&limit=3`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_BASE}/auth/admin/audit-logs?page=0&limit=3`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const pendingItems = (pendingRes.data?.data?.data || []).map(
          (request) => ({
            id: `pending-${request.id}`,
            text: `Nouvelle demande d'inscription de ${request.firstName} ${request.lastName}`,
            time: formatRelativeTime(request.createdAt),
            icon: Users,
            tone: "text-primary bg-primary-soft",
          })
        );

        const auditItems = (auditRes.data?.data?.data || []).map((log) => {
          const style = getNotificationStyle(log.action);
          return {
            id: `audit-${log.id}`,
            text: log.description || log.action,
            time: formatRelativeTime(log.createdAt),
            icon: style.icon,
            tone: style.tone,
          };
        });

        setNotifications([...pendingItems, ...auditItems].slice(0, 5));
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="icon-button-pro"
      >
        <Bell className="size-5" />
        {!loading && notifications.length > 0 && (
          <span className="notification-dot" />
        )}
      </button>

      {open && (
        <div className="dropdown-pro">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <span className="dropdown-badge">
              {loading
                ? "Chargement..."
                : `${notifications.length} ${
                    notifications.length > 1 ? "nouvelles" : "nouvelle"
                  }`}
            </span>
          </div>

          <div className="dropdown-list">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Chargement des notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Aucune notification
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vous êtes à jour !
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <button key={n.id} type="button" className="dropdown-item">
                    <div className={`dropdown-item-icon ${n.tone}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="dropdown-item-content">
                      <p className="dropdown-item-text">{n.text}</p>
                      <p className="dropdown-item-time">{n.time}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!loading && notifications.length > 0 && (
            <div className="dropdown-footer">
              <Link to="/admin/audit">Voir toutes les notifications</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APP SHELL
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
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleGlobalSearch = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/admin/utilisateurs?q=${encodeURIComponent(query)}` : "/admin/utilisateurs");
  };

  // Raccourci clavier « / » pour focus la recherche
  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName;
      if (
        event.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Détection du scroll pour ajouter ombre au topbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* ===== Sidebar desktop ===== */}
      <aside className="sidebar-pro fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <SidebarContent nav={nav} role={role} userName={userName} />
      </aside>

      {/* ===== Drawer mobile ===== */}
      {mobileOpen && (
        <>
          <div
            className="mobile-overlay lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="mobile-drawer lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="mobile-close"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              nav={nav}
              role={role}
              userName={userName}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* ===== Colonne principale ===== */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col lg:pl-72">
        {/* Topbar */}
        <header className={`topbar-pro ${scrolled ? "scrolled" : ""}`}>
          <div className="topbar-content">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                className="icon-button-pro lg:hidden"
              >
                <Menu className="size-5" />
              </button>

              <div className="topbar-title">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="search-bar-pro">
                <Search className="search-bar-icon size-4" />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleGlobalSearch}
                  placeholder="Rechercher…"
                  aria-label="Rechercher"
                />
                <div className="search-shortcut">
                  <Keyboard className="size-3" />
                  <span>/</span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
                className="icon-button-pro"
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="main-content">
          <div className="main-content-inner space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
