import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  UploadCloud, 
  File, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Search, 
  MoreVertical, 
  Eye, 
  Sparkles, 
  Trash2, 
  Loader2, 
  X,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import apiFetch from "@/utils/api";
import { fetchCourses, fetchDocumentsForCourses, formatDate } from "@/utils/academic";

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function getFileIcon(type) {
  if (type.includes("pdf")) return <FileText className="size-5 text-error" />;
  if (type.includes("word") || type.includes("document")) return <FileSpreadsheet className="size-5 text-primary" />;
  if (type.includes("image")) return <ImageIcon className="size-5 text-success" />;
  return <File className="size-5 text-muted-foreground" />;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Octets";
  const k = 1024;
  const sizes = ["Octets", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DocumentCard({ doc, index, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const statusConfig = {
    uploaded: { label: "Téléversé", class: "badge-role-teacher", icon: Clock },
    processed: { label: "Traité", class: "badge-role-student", icon: CheckCircle2 },
    processing: { label: "Traitement en cours", class: "bg-warning-soft text-warning border border-warning/20", icon: Loader2 },
    failed: { label: "Échec du traitement", class: "bg-error-soft text-error border border-error/20", icon: AlertTriangle },
  };
  const status = statusConfig[doc.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div 
      className="request-card card-surface group p-5 flex flex-col gap-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary-soft">
            {getFileIcon(doc.type)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-foreground truncate" title={doc.name}>
              {doc.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileSize(doc.size)} • {doc.date}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Actions du document"
          >
            <MoreVertical className="size-4" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="dropdown-menu absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-xl">
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("view", doc); }}>
                  <Eye className="size-4 text-primary" /> Aperçu
                </button>
                <div className="my-1 border-t border-border"></div>
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-soft" onClick={() => { setMenuOpen(false); onAction("delete", doc); }}>
                  <Trash2 className="size-4" /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.class}`}>
          <StatusIcon className={`size-3 ${doc.status === "processing" ? "animate-spin" : ""}`} />
          {status.label}
        </span>
        
        <span className="text-xs text-muted-foreground">{doc.courseCode}</span>
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => onAction("assistant", doc)}>
        <Sparkles className="size-4" /> Assistant IA
      </Button>
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
   ========================================================= */

export default function Page() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const fileInputRef = useRef(null);

  const notify = (type, message) => {
    setFeedback({ type, message, exiting: false });
    setTimeout(() => {
      setFeedback((f) => (f ? { ...f, exiting: true } : null));
      setTimeout(() => setFeedback(null), 300);
    }, 3500);
  };

  const normalizeDocument = (document) => ({
    id: document.id,
    courseId: document.courseId,
    name: document.originalName,
    type: document.mimeType || document.extension || "",
    size: Number(document.fileSize) || 0,
    date: formatDate(document.createdAt),
    courseCode: document.course?.code || "",
    status: String(document.status || "UPLOADED").toLowerCase(),
  });

  useEffect(() => {
    let active = true;
    fetchCourses().then(async (loadedCourses) => {
      const loadedDocuments = await fetchDocumentsForCourses(loadedCourses);
      if (!active) return;
      setCourses(loadedCourses);
      setCourseId(String(loadedCourses[0]?.id ?? ""));
      setDocuments(loadedDocuments.map(normalizeDocument));
    }).catch((error) => { if (active) notify("error", error.message || "Impossible de charger les documents."); });
    return () => { active = false; };
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    if (!courseId) return notify("error", "Sélectionnez d'abord un cours.");
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(async (file) => {
        const body = new FormData();
        body.append("file", file);
        const response = await apiFetch(`/documents/courses/${courseId}/documents`, { method: "POST", body });
        return normalizeDocument(response.data);
      }));
      setDocuments((prev) => [...uploaded, ...prev]);
      notify("success", `${uploaded.length} document(s) ajouté(s) avec succès.`);
    } catch (error) {
      notify("error", error.message || "L'envoi du document a échoué.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAction = async (action, doc) => {
    if (action === "assistant") {
      navigate(`/enseignant/ia/document/${doc.id}`);
    } else if (action === "view") {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const token = localStorage.getItem("educai_access_token");
        const response = await fetch(`${apiUrl}/documents/${doc.id}/preview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (!response.ok) {
          let message = "Impossible d'afficher ce document.";
          try {
            const error = await response.json();
            message = error.message || message;
          } catch {
            // The server may return an empty error response.
          }
          throw new Error(message);
        }

        const url = URL.createObjectURL(await response.blob());
        const previewWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (!previewWindow) notify("error", "Autorisez les fenêtres contextuelles pour afficher l'aperçu.");
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (error) {
        notify("error", error.message || "Impossible d'afficher ce document.");
      }
    } else if (action === "delete") {
      setDeleteTarget(doc);
    } else {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const token = localStorage.getItem("educai_access_token");
        const response = await fetch(`${apiUrl}/documents/documents/${doc.id}/download`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!response.ok) throw new Error("Impossible de télécharger ce document.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.name;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        notify("error", error.message || "Le téléchargement a échoué.");
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/documents/${deleteTarget.id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((document) => document.id !== deleteTarget.id));
      notify("success", `"${deleteTarget.name}" a été supprimé.`);
      setDeleteTarget(null);
    } catch (error) {
      notify("error", error.message || "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" ||
        (filterType === "pdf" && d.type.includes("pdf")) ||
        (filterType === "word" && (d.type.includes("word") || d.type.includes("document") || d.type.includes(".doc"))) ||
        (filterType === "presentation" && (d.type.includes("presentation") || d.type.includes("powerpoint") || d.type.includes(".ppt")));
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, filterType]);

  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Bibliothèque de documents"
      subtitle="Déposez vos supports pédagogiques pour analyse IA."
    >
      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          className="stat-card" 
          label="Total documents" 
          value={String(documents.length)} 
          icon={FileText} 
          accent="primary" 
        />
        <StatCard 
          className="stat-card" 
          label="Traités" 
          value={String(documents.filter(d => d.status === "processed").length)} 
          icon={CheckCircle2} 
          accent="success" 
        />
        <StatCard 
          className="stat-card" 
          label="Téléversés" 
          value={String(documents.filter(d => d.status === "uploaded").length)} 
          icon={Clock} 
          accent="warning" 
        />
        <StatCard 
          className="stat-card" 
          label="Stockage utilisé" 
          value={formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))} 
          icon={UploadCloud} 
          accent="primary" 
        />
      </div>

      {/* === ZONE D'UPLOAD === */}
      <SectionCard>
        <label className="mb-4 block text-sm font-medium">
          Cours de destination
          <select className="input-field mt-2 w-full" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">Sélectionner un cours</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}
          </select>
        </label>
        <div 
          className={`
            relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
            ${isDragging 
              ? "border-primary bg-primary-soft/30 scale-[1.01]" 
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            onChange={(e) => handleUpload(e.target.files)}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary transition-transform duration-500 ${isDragging ? "scale-110" : "animate-float"}`}>
              {isUploading ? <Loader2 className="size-8 animate-spin" /> : <UploadCloud className="size-8" />}
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {isUploading ? "Téléchargement en cours..." : "Glissez-déposez vos fichiers ici"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF, Word ou PowerPoint jusqu'à 20 Mo
              </p>
            </div>
            {!isUploading && (
              <Button type="button" className="btn mt-2 pointer-events-auto" onClick={() => fileInputRef.current?.click()}>
                Parcourir les fichiers
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard title="Vos documents">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Tous" },
                { value: "pdf", label: "PDF" },
                { value: "word", label: "Word" },
                { value: "presentation", label: "PowerPoint" }
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`filter-btn rounded-lg border border-border px-4 py-2 text-sm font-medium transition ${
                    filterType === filter.value ? "active" : "bg-background hover:bg-muted"
                  }`}
                  onClick={() => setFilterType(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* === LISTE DES DOCUMENTS === */}
          {filteredDocuments.length === 0 ? (
            <div className="empty-state py-16 text-center">
              <div className="empty-state-icon mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary-soft">
                <FileText className="size-10 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                {searchQuery || filterType !== "all" ? "Aucun résultat" : "Aucun document déposé"}
              </h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {searchQuery || filterType !== "all" 
                  ? "Essayez de modifier vos critères de recherche ou vos filtres." 
                  : "Téléversez un PDF, Word ou PowerPoint pour ce cours."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc, index) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  index={index} 
                  onAction={handleAction} 
                />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* === TOAST NOTIFICATIONS === */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce document ?"
        description="Cette action est définitive et ne peut pas être annulée."
        itemName={deleteTarget?.name}
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      {feedback && (
        <div
          className={`toast fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg p-4 shadow-xl ${
            feedback.type === "success" ? "toast-success" : feedback.type === "error" ? "toast-error" : "toast-info"
          } ${feedback.exiting ? "toast-exit" : ""}`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5" />
          ) : feedback.type === "error" ? (
            <AlertTriangle className="size-5" />
          ) : (
            <Sparkles className="size-5" />
          )}
          <span className="font-medium text-sm">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 rounded p-1 hover:bg-black/10">
            <X className="size-4" />
          </button>
        </div>
      )}
    </TeacherShell>
  );
}
