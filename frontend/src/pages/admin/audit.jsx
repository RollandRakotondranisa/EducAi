import {
  BarChart3,
  Loader2,
  Filter,
  Download,
  Calendar,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Settings,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

import { SectionCard, EmptyState } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { readSession } from "@/utils/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// === COMPOSANTS RÉUTILISABLES ===

function ActionBadge({ action }) {
  const actionConfig = {
    LOGIN: {
      label: "Connexion",
      class: "action-badge-login",
      icon: LogIn,
    },
    LOGOUT: {
      label: "Déconnexion",
      class: "action-badge-logout",
      icon: LogOut,
    },
    CREATE_USER: {
      label: "Création utilisateur",
      class: "action-badge-create",
      icon: UserPlus,
    },
    DELETE_USER: {
      label: "Suppression",
      class: "action-badge-delete",
      icon: UserMinus,
    },
    UPDATE_USER: {
      label: "Modification",
      class: "action-badge-update",
      icon: Settings,
    },
    APPROVE_USER_REQUEST: {
      label: "Approbation",
      class: "action-badge-approve",
      icon: UserCheck,
    },
    REJECT_USER_REQUEST: {
      label: "Rejet",
      class: "action-badge-reject",
      icon: UserX,
    },
  };

  const config = actionConfig[action] || {
    label: action,
    class: "action-badge-default",
    icon: Settings,
  };

  const Icon = config.icon;

  return (
    <span className={`action-badge ${config.class}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const isSuccess = status === "SUCCESS";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <span
      className={`status-badge ${
        isSuccess ? "status-badge-success" : "status-badge-error"
      }`}
    >
      <span
        className={`status-dot-indicator ${
          isSuccess ? "status-dot-success" : "status-dot-error"
        }`}
      ></span>
      {isSuccess ? "Succès" : "Erreur"}
    </span>
  );
}

function DateCell({ dateString }) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="date-cell">
      <span className="date-primary">{dateStr}</span>
      <span className="date-secondary">{timeStr}</span>
    </div>
  );
}

function UserCell({ user }) {
  const name = user?.name || "Utilisateur supprimé";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="user-cell">
      <div className="user-avatar-small">{initials || "U"}</div>
      <div className="user-info">
        <span className="user-id">{name}</span>
        <span className="user-label">{user?.email || "Compte indisponible"}</span>
      </div>
    </div>
  );
}

function AuditLogRow({ log, index }) {
  return (
    <tr style={{ animationDelay: `${index * 40}ms` }}>
      <td>
        <DateCell dateString={log.createdAt} />
      </td>
      <td>
        <ActionBadge action={log.action} />
      </td>
      <td>
        <UserCell user={log.user} />
      </td>
      <td>
        <div className="description-cell" title={log.description || ""}>
          {log.description || "-"}
        </div>
      </td>
      <td>
        <StatusBadge status={log.status} />
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton skeleton-cell"></div>
      <div className="skeleton skeleton-cell"></div>
      <div className="skeleton skeleton-cell"></div>
      <div className="skeleton skeleton-cell"></div>
      <div className="skeleton skeleton-cell"></div>
    </div>
  );
}

function Pagination({ pagination, currentPage, onPageChange }) {
  const { totalPages, total } = pagination;
  const pages = [];

  // Générer les numéros de page à afficher
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span className="pagination-results">{total}</span>
        <span>résultat{total > 1 ? "s" : ""} total</span>
      </div>

      <div className="pagination-controls">
        <button
          className="page-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" />
        </button>

        {start > 1 && (
          <>
            <button
              className="page-button"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            className={`page-button ${page === currentPage ? "active" : ""}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2">...</span>}
            <button
              className="page-button"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="page-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message, onClose }) {
  return (
    <div className="error-banner flex items-center gap-3" role="alert">
      <AlertTriangle className="size-5 flex-shrink-0 text-error" />
      <span className="flex-1 text-sm font-medium text-error">{message}</span>
      <button
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-error/10"
        aria-label="Fermer"
      >
        <XCircle className="size-4 text-error" />
      </button>
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

function Page() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    perPage: 50,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, [filters.page, filters.action, filters.userId]);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("educai_access_token");
      const params = new URLSearchParams({
        page: filters.page - 1, // API utilise 0-indexed
        limit: 50,
      });

      if (filters.action) params.append("action", filters.action);
      if (filters.userId) params.append("userId", filters.userId);

      const response = await axios.get(
        `${API_BASE}/auth/admin/audit-logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.data) {
        setAuditLogs(response.data.data.data || []);
        setPagination({
          total: response.data.data.total,
          page: response.data.data.page + 1, // Convertir en 1-indexed
          totalPages: response.data.data.totalPages,
          perPage: response.data.data.perPage,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des logs d'audit:", error);
      setExportError(
        error.response?.data?.message ||
          "Impossible de charger les logs d'audit."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  async function handleExportCsv() {
    try {
      setIsExporting(true);
      setExportError("");
      const accessToken = localStorage.getItem("educai_access_token");
      const params = new URLSearchParams();
      if (filters.action) params.set("action", filters.action);
      if (filters.userId) params.set("userId", filters.userId);

      const response = await axios.get(
        `${API_BASE}/auth/admin/audit-logs/export?${params}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(
        new Blob([response.data], { type: "text/csv;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `journal-audit-${new Date()
        .toISOString()
        .split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      setExportError(
        error.response?.data?.message || "Impossible d'exporter le journal d'audit."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Journal d'audit"
        description="Traçabilité complète de toutes les actions effectuées sur la plateforme."
      >
        {/* Filtres */}
        <div className="filter-bar mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="size-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Filtres de recherche
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filter-action" className="text-xs font-semibold">
                Type d'action
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-action"
                  placeholder="LOGIN, CREATE_USER..."
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-user" className="text-xs font-semibold">
                ID utilisateur
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-user"
                  type="number"
                  placeholder="Ex: 123"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="export-button w-full"
                onClick={handleExportCsv}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Export en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    <span>Exporter CSV</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Erreur d'export */}
        {exportError && (
          <ErrorBanner
            message={exportError}
            onClose={() => setExportError("")}
          />
        )}

        {/* Tableau d'audit */}
        {loading ? (
          <div className="space-y-0">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">
              Aucun log d'audit
            </h3>
            <p className="text-sm text-muted-foreground">
              Aucune action n'a été enregistrée avec ces filtres.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Date / Heure</th>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th>Description</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <AuditLogRow key={log.id} log={log} index={index} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              currentPage={filters.page}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </SectionCard>
    </>
  );
}

export default Page;
