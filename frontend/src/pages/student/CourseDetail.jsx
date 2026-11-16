import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Download,
  Eye,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  File,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";

/* =========================================================
   UTILITIES
   ========================================================= */

function getFileIcon(mimeType = "", extension = "") {
  const type = (mimeType || extension).toLowerCase();
  
  if (type.includes("pdf")) return <FileText className="size-5 text-error" />;
  if (type.includes("word") || type.includes("document")) return <FileText className="size-5 text-primary" />;
  if (type.includes("image")) return <ImageIcon className="size-5 text-success" />;
  if (type.includes("spreadsheet") || type.includes("excel")) return <FileText className="size-5 text-warning" />;
  
  return <File className="size-5 text-muted-foreground" />;
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchDocumentBlob(documentId) {
  const token = localStorage.getItem("educai_access_token");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${apiUrl}/documents/${documentId}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Erreur HTTP ${response.status}`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // The server may return a non-JSON error response.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

/* =========================================================
   DOCUMENT CARD
   ========================================================= */

function DocumentCard({ document, onView, onDownload, loading }) {
  return (
    <div className="request-card card-surface p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
          {getFileIcon(document.mimeType, document.extension)}
        </div>
        
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground truncate">
            {document.originalName}
          </h4>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <span>{formatDate(document.createdAt)}</span>
            {document.status && (
              <>
                <span>•</span>
                <span className={`rounded-full px-2 py-0.5 ${
                  document.status === "PROCESSED" 
                    ? "bg-success-soft text-success"
                    : document.status === "PROCESSING"
                    ? "bg-warning-soft text-warning"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {document.status === "PROCESSED" ? "Prêt" : 
                   document.status === "PROCESSING" ? "En cours..." :
                   document.status === "FAILED" ? "Erreur" : "Téléversé"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(document)}
          disabled={loading}
          className="rounded-lg"
        >
          <Eye className="size-4" />
          <span className="hidden sm:inline">Lire</span>
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => onDownload(document)}
          disabled={loading}
          className="rounded-lg"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Télécharger</span>
        </Button>
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT VIEWER MODAL
   ========================================================= */

function DocumentViewerModal({ document, onClose, loading }) {
  const [viewError, setViewError] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  // Determine if document can be viewed directly
  const canViewDirectly = document?.mimeType?.includes("pdf") || 
                          document?.mimeType?.includes("image") ||
                          document?.mimeType?.includes("text");

  // Load blob URL for viewing/downloading
  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      try {
        const blob = await fetchDocumentBlob(document.id);
        if (isMounted) {
          const url = window.URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (error) {
        console.error("Failed to load document:", error);
        if (isMounted) {
          setViewError(true);
        }
      }
    };

    if (canViewDirectly) {
      loadDocument();
    }

    return () => {
      isMounted = false;
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [document.id, canViewDirectly]);

  const handleDownloadFromViewer = async () => {
    try {
      if (blobUrl) {
        // Use existing blob URL if already loaded
        const link = window.document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", document.originalName);
        window.document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
      } else {
        // Fetch and download
        const blob = await fetchDocumentBlob(document.id);
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.setAttribute("download", document.originalName);
        window.document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || "Erreur lors du téléchargement du document");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(document.mimeType, document.extension)}
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {document.originalName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : viewError ? (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <AlertCircle className="size-12 text-error" />
              <p className="font-semibold text-foreground">
                Impossible d'afficher ce document
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Le format de ce fichier ne peut pas être affiché dans le navigateur.
              </p>
              <Button
                onClick={handleDownloadFromViewer}
                className="rounded-lg"
              >
                <Download className="size-4" />
                Télécharger le document
              </Button>
            </div>
          ) : canViewDirectly ? (
            blobUrl ? (
              <iframe
                src={blobUrl}
                className="w-full h-full border-none"
                title="Document viewer"
                onError={() => setViewError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
                <p>Chargement du document...</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <File className="size-12 text-muted-foreground" />
              <p className="font-semibold text-foreground">
                Document non visualisable
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Ce format de fichier ne peut pas être affiché dans le navigateur.
              </p>
              <Button
                onClick={handleDownloadFromViewer}
                className="rounded-lg"
              >
                <Download className="size-4" />
                Télécharger le document
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button
            variant="default"
            className="rounded-lg ml-auto"
            onClick={handleDownloadFromViewer}
          >
            <Download className="size-4" />
            Télécharger
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFetch(`/courses/${id}`);
        
        if (active) {
          setCourse(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Impossible de charger le cours");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCourse();
    return () => { active = false; };
  }, [id]);

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
  };

  const handleDownloadDocument = async (document) => {
    try {
      setDownloading(true);
      const blob = await fetchDocumentBlob(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", document.originalName);
      window.document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || "Erreur lors du téléchargement du document");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <AppShell nav={studentNav} role="étudiant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p>Chargement du cours...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !course) {
    return (
      <AppShell nav={studentNav} role="étudiant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="size-12 text-error" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Cours non trouvé
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {error || "Le cours demandé n'existe pas ou n'est plus disponible."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/etudiant/cours")}
              className="rounded-lg"
            >
              <ArrowLeft className="size-4" />
              Retour aux cours
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const documents = course.documents || [];
  const hasDocuments = documents.length > 0;

  return (
    <AppShell
      nav={studentNav}
      role="étudiant"
      title={course.name}
      subtitle={`Code: ${course.code}`}
    >
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate("/etudiant/cours")}
        className="rounded-lg mb-6"
      >
        <ArrowLeft className="size-4" />
        Retour aux cours
      </Button>
      <Button variant="default" onClick={() => navigate(`/etudiant/ia/${id}`)} className="mb-6 ml-2 rounded-lg">
        <Sparkles className="size-4" />
        Assistance IA
      </Button>

      {/* Course Header */}
      <SectionCard className="mb-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                {course.name}
              </h1>
              <p className="text-muted-foreground">{course.description}</p>
            </div>
            <div className="shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <BookOpen className="size-8" />
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="grid gap-3 sm:grid-cols-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Enseignant</p>
                <p className="font-semibold text-foreground">
                  {course.teacher?.firstName} {course.teacher?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Créé le</p>
                <p className="font-semibold text-foreground">
                  {formatDate(course.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <p className="font-semibold text-foreground">
                  {documents.length} document{documents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Documents Section */}
      <SectionCard
        title={`Documents du cours (${documents.length})`}
        className="mb-6"
      >
        {!hasDocuments ? (
          <div className="empty-state py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="size-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Aucun document disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              L'enseignant n'a pas encore ajouté de document à ce cours.
              Revenez plus tard pour consulter les supports pédagogiques.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                loading={downloading}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          loading={downloading}
        />
      )}
    </AppShell>
  );
}
