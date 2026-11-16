import { useEffect, useState } from "react";
import { FileText, Image, Megaphone, Paperclip, Plus, Trash2 } from "lucide-react";
import apiFetch from "@/utils/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { readSession } from "@/utils/session";

const initialForm = { title: "", content: "", targetRole: "ALL", expiresAt: "", attachments: [] };
const targetLabels = { STUDENT: "Étudiants", TEACHER: "Enseignants", ALL: "Tous les utilisateurs", ADMIN: "Administrateurs acceptés" };

export default function AnnouncementsPage() {
  const isSuperAdmin = Boolean(readSession().user?.isSuperAdmin);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    targetRole: isSuperAdmin ? "ADMIN" : initialForm.targetRole,
  }));
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/announcements");
      setAnnouncements(response.data || []);
    } catch (loadError) {
      setError(loadError.message || "Impossible de charger les annonces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const body = new FormData();
      body.append("title", form.title);
      body.append("content", form.content);
      body.append("targetRole", form.targetRole);
      if (form.expiresAt) body.append("expiresAt", form.expiresAt);
      form.attachments.forEach((file) => body.append("attachments", file));
      await apiFetch("/announcements", { method: "POST", body });
      setForm({
        ...initialForm,
        targetRole: isSuperAdmin ? "ADMIN" : initialForm.targetRole,
      });
      setSuccess("Annonce publiée avec succès.");
      await loadAnnouncements();
    } catch (saveError) {
      setError(saveError.message || "La publication a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/announcements/${deleteTarget.id}`, { method: "DELETE" });
      setAnnouncements((current) => current.filter((announcement) => announcement.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.message || "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  };

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Megaphone /></span><div><h1 className="font-display text-2xl font-semibold text-foreground">Gestion des annonces</h1><p className="text-sm text-muted-foreground">Publiez une information ciblée dans les tableaux de bord.</p></div></div>
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold"><Plus className="size-4 text-primary" /> Nouvelle annonce</h2>
        <div className="space-y-4">
          <label className="block text-sm font-medium">Titre<input required minLength={3} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="input-field mt-2 w-full rounded-lg px-3 py-2.5 text-sm" placeholder="Information importante" /></label>
          <label className="block text-sm font-medium">Destinataires<select value={form.targetRole} onChange={(event) => setForm((current) => ({ ...current, targetRole: event.target.value }))} className="input-field mt-2 w-full rounded-lg px-3 py-2.5 text-sm">{isSuperAdmin ? <option value="ADMIN">Administrateurs acceptés uniquement</option> : <><option value="ALL">Tous les utilisateurs</option><option value="STUDENT">Étudiants uniquement</option><option value="TEACHER">Enseignants uniquement</option></>}</select></label>
          <label className="block text-sm font-medium">Message<textarea required minLength={3} rows={7} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className="input-field mt-2 w-full rounded-lg px-3 py-2.5 text-sm" placeholder="Rédigez votre annonce..." /></label>
          <label className="block text-sm font-medium"><span className="flex items-center gap-2"><Paperclip className="size-4 text-primary" /> Pièces jointes</span><input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp" onChange={(event) => setForm((current) => ({ ...current, attachments: Array.from(event.target.files || []) }))} className="mt-2 block w-full rounded-lg border border-dashed border-border-strong bg-muted px-3 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:font-semibold file:text-primary" />{form.attachments.length > 0 && <span className="mt-2 block text-xs text-muted-foreground">{form.attachments.map((file) => file.name).join(", ")}</span>}</label>
          <label className="block text-sm font-medium">Date d'expiration <span className="font-normal text-muted-foreground">(facultatif)</span><input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} className="input-field mt-2 w-full rounded-lg px-3 py-2.5 text-sm" /></label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-error-soft p-3 text-sm text-error">{error}</p>}
        {success && <p className="mt-4 rounded-lg bg-success-soft p-3 text-sm text-success">{success}</p>}
        <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-60"><Megaphone className="size-4" />{saving ? "Publication..." : "Publier l'annonce"}</button>
      </form>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold">Annonces publiées</h2><p className="text-sm text-muted-foreground">Elles apparaissent immédiatement aux rôles ciblés.</p></div><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{announcements.length}</span></div>{loading ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p> : announcements.length === 0 ? <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">Aucune annonce publiée.</p> : <div className="space-y-3">{announcements.map((announcement) => <article key={announcement.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{announcement.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{targetLabels[announcement.targetRole]}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.content}</p>{announcement.attachments?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{announcement.attachments.map((attachment) => <span key={attachment.id} className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-1 text-xs text-primary">{attachment.kind === "IMAGE" ? <Image className="size-3" /> : <FileText className="size-3" />}{attachment.originalName}</span>)}</div>}<p className="mt-3 text-xs text-muted-foreground">Publié le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(announcement.publishedAt))}</p></div><button type="button" onClick={() => setDeleteTarget(announcement)} className="rounded-lg p-2 text-error hover:bg-error-soft" aria-label={`Supprimer l'annonce ${announcement.title}`}><Trash2 className="size-4" /></button></div></article>)}</div>}</section>
    </div>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Supprimer l'annonce ?"
      description="Cette action est définitive et ne peut pas être annulée."
      itemName={deleteTarget?.title}
      isBusy={deleting}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={handleDelete}
    />
  </div>;
}
