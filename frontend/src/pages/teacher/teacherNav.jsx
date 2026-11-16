import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Sparkles,
  GraduationCap,
  Users,
  BarChart3,
  CircleUser,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Keyboard,
  Settings,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import apiFetch from "@/utils/api";
import { clearSession, getCurrentUserName, getCurrentUserRoleLabel, readSession } from "@/utils/session";
import educaiLogo from "../../assets/educai-logo.png";
import AssistantWidget from "@/components/AssistantWidget";

/* =========================================================
   NAVIGATION DE L'ESPACE ENSEIGNANT
   ========================================================= */

export const teacherNav = [
  { 
    to: "/enseignant", 
    label: "Tableau de bord", 
    icon: LayoutDashboard, 
    end: true,
    description: "Vue d'ensemble"
  },
  { 
    to: "/enseignant/cours", 
    label: "Cours", 
    icon: BookOpen,
    description: "Gestion des cours",
    badge: "8"
  },
  { 
    to: "/enseignant/documents", 
    label: "Documents", 
    icon: FileText,
    description: "Ressources pédagogiques"
  },
  { 
    to: "/enseignant/ia", 
    label: "Assistance IA", 
    icon: Sparkles,
    description: "Assistant pédagogique"
  },
  {
    to: "/enseignant/messages",
    label: "Messages",
    icon: Bell,
    description: "Messagerie interne"
  },
  { 
    to: "/enseignant/examens", 
    label: "Examens", 
    icon: GraduationCap,
    description: "Évaluations"
  },
  { 
    to: "/enseignant/etudiants", 
    label: "Étudiants", 
    icon: Users,
    description: "Suivi des élèves"
  },
  { 
    to: "/enseignant/statistiques", 
    label: "Statistiques", 
    icon: BarChart3,
    description: "Analyses détaillées"
  },
  { 
    to: "/enseignant/profil", 
    label: "Profil", 
    icon: CircleUser,
    description: "Paramètres personnels"
  },
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

function getNotificationStyle(action) {
  const normalized = String(action || "").toUpperCase();

  if (normalized.includes("APPROVE") || normalized.includes("LOGIN") || normalized.includes("PUBLISHED") || normalized.includes("SUCCESS")) {
    return { icon: CheckCircle2, tone: "text-success bg-success-soft" };
  }

  if (normalized.includes("REJECT") || normalized.includes("LOGOUT") || normalized.includes("FAILED") || normalized.includes("WARNING")) {
    return { icon: AlertTriangle, tone: "text-error bg-error-soft" };
  }

  return { icon: Info, tone: "text-primary bg-primary-soft" };
}

/* =========================================================
   SIDEBAR CONTENT — ANIMATIONS AVANCÉES
   ========================================================= */

function SidebarContent({ nav, role, userName, userAvatar, onNavigate }) {
  const { pathname } = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div className="flex h-full flex-col">
      {/* Logo avec animation */}
      <div className="sidebar-logo group cursor-pointer">
        <div className="sidebar-logo-icon transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
          <img 
            src={educaiLogo} 
            alt="EduAI" 
            className="h-full w-full rounded-lg object-contain p-1"
          />
        </div>
        <div className="sidebar-logo-text">
          <h2 className="tracking-tight">EduAI</h2>
          <p className="text-xs opacity-80">Espace enseignant</p>
        </div>
      </div>

      {/* Navigation avec stagger animation */}
      <nav className="sidebar-nav space-y-1" aria-label="Navigation enseignant">
        {nav.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.end
            ? pathname === item.to
            : pathname.startsWith(item.to);
          
          const delay = index * 50; // Stagger delay

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
              aria-current={isActive ? "page" : undefined}
              className={`
                nav-item group relative overflow-hidden
                ${isActive ? "active" : ""}
                animate-slide-in-left
              `}
              style={{
                animationDelay: `${delay}ms`,
                animationFillMode: "both",
              }}
            >
              {/* Background glow effect */}
              <div 
                className={`
                  absolute inset-0 bg-gradient-to-r from-white/10 to-transparent
                  transform transition-transform duration-500 ease-out
                  ${isActive || hoveredItem === item.to ? "translate-x-0" : "-translate-x-full"}
                `}
              />
              
              {/* Active indicator */}
              <div 
                className={`
                  absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full
                  bg-white shadow-lg shadow-white/30
                  transition-all duration-300 ease-out
                  ${isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}
                `}
              />

              <span className="nav-icon relative z-10">
                <Icon 
                  className={`
                    size-5 transition-all duration-300
                    ${isActive ? "scale-110 text-white" : "text-white/70 group-hover:scale-110 group-hover:text-white"}
                  `} 
                />
              </span>
              
              <div className="nav-label relative z-10 flex flex-col">
                <span className={`
                  font-medium transition-colors duration-300
                  ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}
                `}>
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors duration-300">
                    {item.description}
                  </span>
                )}
              </div>

              {/* Badge */}
              {item.badge && (
                <span className="nav-badge relative z-10 animate-pulse">
                  {item.badge}
                </span>
              )}

              {/* Coming soon badge */}
              {item.comingSoon && (
                <span className="ml-auto text-[10px] font-semibold text-white/40">
                  Bientôt
                </span>
              )}

              {/* Chevron for active state */}
              <ChevronRight 
                className={`
                  ml-auto size-4 text-white/40
                  transition-all duration-300
                  ${isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}
                `}
              />
            </Link>
          );
        })}
      </nav>

      {/* User profile section avec hover effect */}
      <div className="sidebar-user mt-auto">
        <div className="sidebar-user-card group cursor-pointer">
          <div className="relative">
            <div className="sidebar-user-avatar ring-2 ring-white/20 transition-all duration-300 group-hover:ring-white/40 group-hover:scale-105">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-full w-full rounded-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-primary-deep animate-pulse" />
          </div>
          
          <div className="sidebar-user-info min-w-0">
            <p className="sidebar-user-name truncate font-semibold">
              {userName}
            </p>
            <p className="sidebar-user-role truncate text-xs text-white/60">
              {capitalize(role)}
            </p>
          </div>

          <ChevronRight className="ml-auto size-4 text-white/40 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   USER MENU — DROPDOWN ANIMÉ
   ========================================================= */

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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
    setConfirmingLogout(false);
    try {
      await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
      clearSession();
      navigate("/connexion", { replace: true });
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      navigate("/connexion", { replace: true });
    }
  };

  const menuItems = [
    { to: "/enseignant/profil", icon: CircleUser, label: "Mon profil" },
    { to: "/enseignant/parametres", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Gérer le compte"
        aria-expanded={open}
        className="icon-button-pro group"
      >
        <CircleUser className="size-5 transition-transform duration-300 group-hover:scale-110" />
      </button>

      {open && mounted && (
        <div 
          className="dropdown-pro animate-pop-in origin-top-right"
          style={{ minWidth: "220px" }}
        >
          <div className="border-b border-border bg-muted/50 p-3">
            <p className="text-sm font-semibold text-foreground">Gérer votre compte</p>
            <p className="text-xs text-muted-foreground">Profil, paramètres et déconnexion</p>
          </div>

          <div className="py-1">
            {menuItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="user-menu-item group/item"
                style={{
                  animation: "slideInRight 0.3s ease forwards",
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <div className="user-menu-icon transition-colors duration-200 group-hover/item:bg-primary-soft group-hover/item:text-primary">
                  <item.icon className="size-4" />
                </div>
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover/item:translate-x-1 group-hover/item:opacity-100" />
              </Link>
            ))}
          </div>

          <div className="border-t border-border" />

          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            className="user-menu-item danger w-full justify-start px-4 py-2.5 text-left"
            style={{
              animation: "slideInRight 0.3s ease forwards",
              animationDelay: `${menuItems.length * 50}ms`,
              opacity: 0,
            }}
          >
            <div className="user-menu-icon bg-error-soft text-error group-hover:bg-error/20">
              <LogOut className="size-4" />
            </div>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      )}

      {confirmingLogout && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-2xl">
            <h2 id="logout-title" className="text-lg font-semibold text-foreground">Se déconnecter ?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Votre session enseignant sera fermée sur cet appareil.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmingLogout(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Annuler
              </button>
              <button type="button" onClick={handleLogout} className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error/90">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   NOTIFICATION BELL — ANIMATIONS FLUIDES
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

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await apiFetch("/auth/teacher/notifications?limit=8&page=0");
        const payload = response?.data ?? response;
        const items = Array.isArray(payload?.data) ? payload.data : [];
        const normalizedItems = items.map((notification) => {
          const style = getNotificationStyle(notification.action || "INFO");
          return {
            id: `audit-${notification.id}`,
            dbId: notification.id,
            text: notification.description || notification.action || "Notification",
            date: notification.createdAt,
            type: notification.action?.includes("REJECT") ? "warning" : "info",
            icon: style.icon,
            tone: style.tone,
            isRead: Boolean(notification.isRead),
          };
        });

        if (!active) return;
        setNotifications(normalizedItems);
      } catch (error) {
        if (active) setNotifications([]);
        console.error("Erreur lors du chargement des notifications enseignant:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();
    const refreshId = window.setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success": return CheckCircle2;
      case "warning": return AlertTriangle;
      default: return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success": return "text-success bg-success-soft";
      case "warning": return "text-warning bg-warning-soft";
      default: return "text-primary bg-primary-soft";
    }
  };

  const dismissNotification = async (notificationId, dbId) => {
    try {
      if (dbId) {
        await apiFetch(`/auth/teacher/notifications/${dbId}/read`, { method: "PATCH" });
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const dismissAllNotifications = async () => {
    try {
      await apiFetch("/auth/teacher/notifications/read-all", { method: "PATCH" });
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
    }

    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="icon-button-pro relative group"
      >
        <Bell className="size-5 transition-transform duration-300 group-hover:scale-110" />
        {!loading && unreadCount > 0 && (
          <span className="notification-dot animate-ping absolute top-2 right-2" />
        )}
        {!loading && unreadCount > 0 && (
          <span className="notification-dot absolute top-2 right-2" />
        )}
      </button>

      {open && mounted && (
        <div className="dropdown-pro animate-pop-in origin-top-right" style={{ minWidth: "360px" }}>
          <div className="dropdown-header flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              <span className="dropdown-badge bg-primary-soft text-primary">{loading ? "..." : unreadCount}</span>
              {!loading && unreadCount > 0 && (
                <button type="button" onClick={dismissAllNotifications} className="text-xs font-medium text-primary hover:text-primary-accent">
                  Tout lire
                </button>
              )}
            </div>
          </div>

          <div className="dropdown-list max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-3 size-5 animate-spin" />Chargement des notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-3 size-12 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">Aucune notification</p>
                <p className="mt-1 text-xs text-muted-foreground">Vous êtes à jour !</p>
              </div>
            ) : (
              notifications.map((n, index) => {
                const Icon = getNotificationIcon(n.type);
                const colorClass = getNotificationColor(n.type);
                
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => dismissNotification(n.id, n.dbId)}
                    aria-label={`Marquer comme lue : ${n.text}`}
                    className="dropdown-item group/item w-full text-left"
                    style={{
                      animation: "eduai-slide-in-right 0.3s ease forwards",
                      animationDelay: `${index * 50}ms`,
                      opacity: 0,
                    }}
                  >
                    <div className={`dropdown-item-icon ${colorClass} transition-transform duration-200 group-hover/item:scale-110`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="dropdown-item-content flex-1">
                      <p className="dropdown-item-text text-sm font-medium">{n.text}</p>
                      <p className="dropdown-item-time text-xs">{formatNotificationTime(n.date)}</p>
                    </div>
                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer border-t border-border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? "Cliquez sur une notification pour la marquer comme lue."
                  : "Toutes les notifications ont été lues."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TEACHER SHELL — COMPOSANT PRINCIPAL
   ========================================================= */

export function TeacherShell({
  nav = teacherNav,
  role,
  userAvatar,
  title = "Tableau de bord",
  subtitle,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const sessionUser = readSession().user;
  const resolvedUserName = getCurrentUserName(sessionUser);
  const resolvedRole = role || getCurrentUserRoleLabel(sessionUser);
  const resolvedUserAvatar = userAvatar || sessionUser?.avatar || null;
  const resolvedSubtitle = subtitle || `Bonjour ${resolvedUserName.split(" ")[0]}, voici l'activité de vos cours.`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGlobalSearch = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/enseignant/cours?q=${encodeURIComponent(query)}` : "/enseignant/cours");
  };

  // Raccourci clavier "/" pour focus recherche
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

  // Détection scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll mobile
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer on escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event) => event.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside 
        className={`
          sidebar-pro fixed inset-y-0 left-0 z-40 hidden w-72 lg:block
          ${mounted ? "animate-fade-in" : ""}
        `}
      >
        <SidebarContent 
          nav={nav} 
          role={resolvedRole} 
          userName={resolvedUserName} 
          userAvatar={resolvedUserAvatar}
        />
      </aside>

      {/* Mobile overlay & drawer */}
      {mobileOpen && (
        <>
          <div
            className="mobile-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="mobile-drawer fixed inset-y-0 left-0 z-50 w-72 lg:hidden animate-slide-in-left">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-transform duration-200 hover:rotate-90 hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            <SidebarContent 
              nav={nav} 
              role={resolvedRole} 
              userName={resolvedUserName}
              userAvatar={resolvedUserAvatar}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex min-h-dvh flex-1 flex-col lg:pl-72">
        {/* Topbar */}
        <header 
          className={`
            topbar-pro sticky top-0 z-30 transition-all duration-300
            ${scrolled ? "scrolled shadow-lg" : ""}
            ${mounted ? "animate-fade-in" : ""}
          `}
        >
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
                <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                {resolvedSubtitle && (
                  <p className="text-sm text-muted-foreground animate-fade-in">
                    {resolvedSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search bar */}
              <div className="search-bar-pro hidden sm:block">
                <Search className="search-bar-icon size-4" />
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  placeholder="Rechercher un cours, un étudiant..."
                  aria-label="Rechercher"
                  className="w-full pl-10 pr-20"
                />
                <div className="search-shortcut hidden md:flex">
                  <Keyboard className="size-3" />
                  <span>/</span>
                </div>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
                className="icon-button-pro group"
              >
                {theme === "dark" ? (
                  <Sun className="size-5 transition-transform duration-500 group-hover:rotate-90" />
                ) : (
                  <Moon className="size-5 transition-transform duration-500 group-hover:-rotate-12" />
                )}
              </button>

              {/* Notifications */}
              <NotificationBell />
              
              {/* User menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="main-content flex-1 overflow-y-auto">
          <div className="main-content-inner mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <AssistantWidget />

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pop-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-pop-in {
          animation: pop-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}

export default TeacherShell;
