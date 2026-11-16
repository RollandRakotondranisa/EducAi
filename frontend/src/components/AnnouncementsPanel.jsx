import { useEffect, useState } from "react";
import { BellRing, Download, FileText, Image, Megaphone, Paperclip, Radio } from "lucide-react";
import apiFetch from "@/utils/api";

const targetLabels = {
  STUDENT: "Étudiants",
  TEACHER: "Enseignants",
  ALL: "Tous les espaces",
};

const formatDate = (value) => {
  if (!value) return "Date non définie";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
};

export default function AnnouncementsPanel({ admin = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const downloadAttachment = async (attachment) => {
    try {
      const token = localStorage.getItem("educai_access_token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBase}/announcements/attachments/${attachment.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Téléchargement impossible");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Le téléchargement a échoué.");
    }
  };

  useEffect(() => {
    let active = true;
    apiFetch("/announcements")
      .then((response) => active && setAnnouncements(response.data || []))
      .catch((loadError) => active && setError(loadError.message || "Impossible de charger les annonces."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (!admin && !loading && !announcements.length && !error) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><Megaphone className="size-5" /></span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Annonces</h2>
            <p className="text-xs text-muted-foreground">Informations officielles de l'administration</p>
          </div>
        </div>
        <BellRing className="size-4 text-primary" />
      </div>
      {loading ? <p className="py-5 text-sm text-muted-foreground">Chargement des annonces...</p> : error ? <p className="rounded-lg bg-error-soft p-3 text-sm text-error">{error}</p> : announcements.length === 0 ? <p className="py-5 text-sm text-muted-foreground">Aucune annonce publiée.</p> : <div className="max-h-72 space-y-3 overflow-y-auto pr-2 [scrollbar-color:var(--primary)_var(--muted)] [scrollbar-width:thin]">{announcements.map((announcement) => <article key={announcement.id} className="rounded-xl border border-border bg-muted/50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-foreground">{announcement.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.content}</p></div><Radio className="mt-1 size-4 shrink-0 text-primary" /></div>{announcement.attachments?.length > 0 && <div className="mt-4"><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Paperclip className="size-3.5" /> Pièces jointes</p><div className="flex flex-wrap gap-2">{announcement.attachments.map((attachment) => <button key={attachment.id} type="button" onClick={() => downloadAttachment(attachment)} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-primary hover:border-primary hover:bg-primary-soft">{attachment.kind === "IMAGE" ? <Image className="size-3.5" /> : <FileText className="size-3.5" />}<span className="max-w-[220px] truncate">{attachment.originalName}</span><Download className="size-3.5" /></button>)}</div></div>}<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-primary-soft px-2 py-1 font-medium text-primary">{targetLabels[announcement.targetRole] || announcement.targetRole}</span><span>{formatDate(announcement.publishedAt)}</span></div></article>)}</div>}
    </section>
  );
}
