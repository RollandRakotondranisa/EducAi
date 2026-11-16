import {
  FileBarChart,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Mail,
  Shield,
  BookOpen,
  GraduationCap,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

import { SectionCard, EmptyState } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getCurrentUserName,
  getCurrentUserRoleLabel,
  readSession,
} from "@/utils/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// === COMPOSANTS RÉUTILISABLES ===

function RoleBadge({ role }) {
  const roleMap = {
    TEACHER: { label: "Enseignant", class: "role-badge-teacher", icon: BookOpen },
    STUDENT: { label: "Étudiant", class: "role-badge-student", icon: GraduationCap },
    ADMIN: { label: "Administrateur", class: "role-badge-admin", icon: Shield },
  };

  const config = roleMap[role] || { label: role, class: "role-badge-teacher", icon: Users };
  const Icon = config.icon;

  return (
    <span className={`role-badge ${config.class}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

function RequestAvatar({ firstName, lastName }) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  return <div className="request-avatar">{initials}</div>;
}

function StatusFeedback({ status, message, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = status === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`status-feedback flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
        isSuccess ? "status-success" : "status-error"
      } ${exiting ? "status-feedback-exit" : ""}`}
    >
      <div className="status-icon">
        {isSuccess ? (
          <CheckCircle2 className="size-5 shrink-0" />
        ) : (
          <AlertTriangle className="size-5 shrink-0" />
        )}
      </div>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(onClose, 300);
        }}
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function RequestCard({
  request,
  isSelected,
  isProcessing,
  onSelect,
  onApprove,
  onReject,
  onCancel,
  approvalReason,
  onReasonChange,
  index,
}) {
  return (
    <div
      className={`request-card card-surface p-5 ${isSelected ? "expanded" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Informations utilisateur */}
        <div className="flex min-w-0 flex-1 gap-4">
          <RequestAvatar
            firstName={request.firstName}
            lastName={request.lastName}
          />

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground">
              {request.firstName} {request.lastName}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              <span className="truncate">{request.email}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleBadge role={request.requestedRole} />
              <span className="date-badge">
                <Calendar className="size-3" />
                {new Date(request.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:items-end">
          {isSelected ? (
            <div className="reason-panel w-full rounded-xl p-4 sm:w-80">
              <label
                htmlFor={`reason-${request.id}`}
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Motif de la décision (optionnel)
              </label>
              <textarea
                id={`reason-${request.id}`}
                value={approvalReason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Ajoutez un commentaire..."
                className="reason-textarea h-24 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none"
                aria-describedby={`reason-help-${request.id}`}
              />
              <p
                id={`reason-help-${request.id}`}
                className="mt-1 text-xs text-muted-foreground"
              >
                Ce motif sera visible par l'utilisateur
              </p>

              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApprove(request.id)}
                  disabled={isProcessing}
                  className="btn-approve flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ThumbsUp className="size-3.5" />
                  )}
                  <span>Approuver</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReject(request.id)}
                  disabled={isProcessing}
                  className="btn-reject flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ThumbsDown className="size-3.5" />
                  )}
                  <span>Refuser</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="px-3"
                  aria-label="Annuler"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onSelect(request)}
              variant="outline"
              className="action-expand"
            >
              Traiter la demande
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRequestCard() {
  return (
    <div className="skeleton-request">
      <div className="skeleton skeleton-request-avatar"></div>
      <div className="skeleton-request-content">
        <div className="skeleton h-4 w-1/3"></div>
        <div className="skeleton h-3 w-2/3"></div>
        <div className="flex gap-2">
          <div className="skeleton h-6 w-24 rounded-full"></div>
          <div className="skeleton h-6 w-32 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

function Page() {
  const { user } = readSession();
  const currentUserName = getCurrentUserName(user);
  const currentRole = getCurrentUserRoleLabel(user);

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [report, setReport] = useState(null);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalReason, setApprovalReason] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Charger les demandes en attente
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  async function fetchPendingRequests() {
    try {
      setLoadingRequests(true);
      const accessToken = localStorage.getItem("educai_access_token");
      const response = await axios.get(
        `${API_BASE}/auth/admin/pending-requests`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.data) {
        setPendingRequests(response.data.data.data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error);
      setReportStatus({
        type: "error",
        message: "Impossible de charger les demandes en attente.",
      });
    } finally {
      setLoadingRequests(false);
    }
  }

  async function handleApproveRequest(requestId) {
    try {
      setProcessingRequestId(requestId);
      const accessToken = localStorage.getItem("educai_access_token");

      const response = await axios.post(
        `${API_BASE}/auth/admin/approve-request/${requestId}`,
        { reason: approvalReason },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.success) {
        setPendingRequests(pendingRequests.filter((r) => r.id !== requestId));
        setApprovalReason("");
        setSelectedRequest(null);
        setReportStatus({
          type: "success",
          message: "Demande approuvée avec succès.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
      setReportStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Erreur lors de l'approbation de la demande.",
      });
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleRejectRequest(requestId) {
    try {
      setProcessingRequestId(requestId);
      const accessToken = localStorage.getItem("educai_access_token");

      const response = await axios.post(
        `${API_BASE}/auth/admin/reject-request/${requestId}`,
        { reason: approvalReason },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.success) {
        setPendingRequests(pendingRequests.filter((r) => r.id !== requestId));
        setApprovalReason("");
        setSelectedRequest(null);
        setReportStatus({
          type: "success",
          message: "Demande refusée.",
        });
      }
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      setReportStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Erreur lors du rejet de la demande.",
      });
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleGenerateReport() {
    setIsGenerating(true);
    setReportStatus(null);

    try {
      const accessToken = localStorage.getItem("educai_access_token");
      const response = await axios.get(`${API_BASE}/auth/admin/report`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const generatedReport = response.data?.data;
      if (generatedReport) {
        setReport(generatedReport);
      }

      setReportStatus({
        type: "success",
        message: "Rapport IA généré avec succès.",
      });
    } catch (error) {
      console.error("[EduAI] Erreur lors de la génération du rapport :", error);
      setReportStatus({
        type: "error",
        message: error.response?.data?.message || "Une erreur s'est produite lors de la génération.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const downloadReport = async (format = "csv") => {
    const accessToken = localStorage.getItem("educai_access_token");
    const response = await axios.get(`${API_BASE}/auth/admin/report/export?type=${format}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `eduai-admin-report.${format === "pdf" ? "pdf" : format === "xlsx" ? "xlsx" : "csv"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Section Rapports */}
      <SectionCard
        title="Rapports analytiques"
        description="Générez des rapports détaillés sur les performances de la plateforme."
      >
        <div className="report-hero card-surface rounded-2xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="empty-state-icon-enhanced mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <FileBarChart className="h-8 w-8 text-primary" />
            </div>

            <h3 className="mb-2 font-display text-xl font-semibold">
              {report ? "Rapport IA admin généré" : "Aucun rapport généré"}
            </h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Générez un rapport complet pour analyser les performances globales
              de votre plateforme éducative.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                aria-busy={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Génération en cours…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Générer un rapport IA</span>
                  </>
                )}
              </Button>

              {report && (
                <>
                  <Button variant="outline" onClick={() => downloadReport("csv")}>Exporter CSV</Button>
                  <Button variant="outline" onClick={() => downloadReport("pdf")}>Exporter PDF</Button>
                  <Button variant="outline" onClick={() => downloadReport("xlsx")}>Exporter Excel</Button>
                </>
              )}
            </div>
          </div>

          {report && (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {report.kpis?.map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                    <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                    <p className="mt-1 text-xs text-primary">{kpi.trend}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <h4 className="mb-3 text-base font-semibold">Score de santé</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                    {report.summary?.healthScore ?? 0}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">État global de la plateforme</p>
                    <p className="text-sm text-muted-foreground">{report.summary?.pendingRequests > 0 ? `${report.summary.pendingRequests} actions à traiter.` : "Aucune anomalie majeure détectée."}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <h4 className="mb-3 text-base font-semibold">Résumé exécutif</h4>
                <p className="text-sm leading-6 text-muted-foreground">{report.executiveSummary?.text}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Source : {report.executiveSummary?.source === "ai" ? "IA Gemini" : "analyse locale"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <h4 className="mb-3 text-base font-semibold">Recommandations prioritaires</h4>
                <div className="space-y-3">
                  {report.recommendations?.map((recommendation) => (
                    <div key={recommendation.title} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{recommendation.title}</p>
                        <Badge variant={recommendation.priority === "high" ? "destructive" : "secondary"}>
                          {recommendation.priority === "high" ? "Priorité haute" : recommendation.priority === "medium" ? "Priorité moyenne" : "Suivi"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{recommendation.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{recommendation.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <h4 className="mb-3 text-base font-semibold">Insights</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {report.insights?.map((insight) => <li key={insight}>• {insight}</li>)}
                </ul>
              </div>
            </div>
          )}

          {reportStatus && (
            <div className="mt-6">
              <StatusFeedback
                status={reportStatus.type}
                message={reportStatus.message}
                onClose={() => setReportStatus(null)}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Section Validation des Nouveaux Utilisateurs */}
      <SectionCard title="Validation des inscriptions">
        <div className="section-header-with-badge mb-6">
          <div>
            <h3 className="text-lg font-semibold">Demandes en attente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez et validez les nouvelles inscriptions
            </p>
          </div>
          {pendingRequests.length > 0 && (
            <div className="pending-counter">
              {pendingRequests.length}
            </div>
          )}
        </div>

        {loadingRequests ? (
          <div className="space-y-4">
            <SkeletonRequestCard />
            <SkeletonRequestCard />
            <SkeletonRequestCard />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state-enhanced py-12 text-center">
            <div className="empty-state-icon-enhanced mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">
              Aucune demande en attente
            </h3>
            <p className="text-sm text-muted-foreground">
              Toutes les demandes d'inscription ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request, index) => (
              <RequestCard
                key={request.id}
                request={request}
                isSelected={selectedRequest?.id === request.id}
                isProcessing={processingRequestId === request.id}
                onSelect={() => setSelectedRequest(request)}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onCancel={() => {
                  setSelectedRequest(null);
                  setApprovalReason("");
                }}
                approvalReason={
                  selectedRequest?.id === request.id ? approvalReason : ""
                }
                onReasonChange={setApprovalReason}
                index={index}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

export default Page;