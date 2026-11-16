import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, Download, FileText, Image, Inbox, Mail, Paperclip, Reply, Search, Send, SendHorizontal, Users } from "lucide-react";
import apiFetch from "@/utils/api";
import { getCurrentRole, readSession } from "@/utils/session";

const roleLabels = {
  ADMIN: "Administrateur",
  TEACHER: "Enseignant",
  STUDENT: "Étudiant",
};

const pageSize = 5;

export default function MessagesPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("received");
  const [recipients, setRecipients] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [inboxMeta, setInboxMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [sentMeta, setSentMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ recipientId: "", title: "", content: "", attachments: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const role = getCurrentRole();
  const isSuperAdmin = Boolean(readSession().user?.isSuperAdmin);

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const token = localStorage.getItem("educai_access_token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBase}/messages/attachments/${attachmentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Téléchargement impossible");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "piece-jointe";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Le téléchargement a échoué.");
    }
  };

  const loadMessages = async (nextSearch = searchTerm) => {
    try {
      setLoading(true);
      const [recipientResponse, inboxResponse, sentResponse] = await Promise.all([
        apiFetch("/messages/recipients"),
        apiFetch(`/messages/inbox?search=${encodeURIComponent(nextSearch)}&page=${inboxMeta.page}&limit=${pageSize}`),
        apiFetch(`/messages/sent?search=${encodeURIComponent(nextSearch)}&page=${sentMeta.page}&limit=${pageSize}`),
      ]);

      setRecipients(recipientResponse.data || []);
      setInbox(inboxResponse.data?.data || []);
      setInboxMeta({
        total: inboxResponse.data?.total || 0,
        page: inboxResponse.data?.page || 1,
        totalPages: inboxResponse.data?.totalPages || 1,
      });
      setSent(sentResponse.data?.data || []);
      setSentMeta({
        total: sentResponse.data?.total || 0,
        page: sentResponse.data?.page || 1,
        totalPages: sentResponse.data?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || "Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    const student = location.state?.selectedStudent || location.state?.recipient;
    if (!student) return;

    const recipientId = student.id ?? student.recipientId ?? "";
    if (!recipientId) {
      setForm((current) => ({
        ...current,
        title: current.title || `Message à ${student.fullName || student.name || "l'étudiant"}`,
      }));
      return;
    }

    const matchesRecipient = recipients.some((user) => String(user.id) === String(recipientId));
    if (!matchesRecipient) return;

    setForm((current) => ({
      ...current,
      recipientId: String(recipientId),
      title: current.title || `Message à ${student.fullName || student.name || "l'étudiant"}`,
    }));
    setSuccess(`Préparation d'un message pour ${student.fullName || student.name || "l'étudiant"}.`);
  }, [location.state, recipients]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requestedPage = activeTab === "received" ? inboxMeta.page : sentMeta.page;
      loadMessages(searchTerm).then(() => {
        if (activeTab === "received") {
          setInboxMeta((current) => ({ ...current, page: requestedPage }));
        } else {
          setSentMeta((current) => ({ ...current, page: requestedPage }));
        }
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const currentMessages = activeTab === "received" ? inbox : sent;
  const currentMeta = activeTab === "received" ? inboxMeta : sentMeta;

  const totalUnread = useMemo(
    () => inbox.filter((message) => !message.isRead).length,
    [inbox]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.recipientId || !form.title.trim() || !form.content.trim()) {
      setError("Veuillez remplir tous les champs avant d'envoyer le message.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("recipientId", String(form.recipientId));
      formData.append("title", form.title.trim());
      formData.append("content", form.content.trim());

      form.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await apiFetch("/messages", {
        method: "POST",
        body: formData,
      });

      setSuccess("Message envoyé avec succès.");
      setForm({ recipientId: "", title: "", content: "", attachments: [] });
      setActiveTab("sent");
      await loadMessages();
    } catch (err) {
      setError(err.message || "L'envoi du message a échoué.");
    }
  };

  const handleReply = async (message) => {
    const recipientId = message.sender?.id ?? "";
    setForm({
      recipientId,
      title: message.title?.startsWith("Réponse") ? message.title : `Réponse : ${message.title}`,
      content: "",
      attachments: [],
    });
    setActiveTab("sent");
    if (message.id && !message.isRead) {
      await apiFetch(`/messages/${message.id}/read`, { method: "PATCH" });
      await loadMessages();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReadMessage = async (message) => {
    if (message.isRead || !message.id) return;
    await apiFetch(`/messages/${message.id}/read`, { method: "PATCH" });
    await loadMessages();
  };

  const renderMessageCard = (message, isReceived = false) => {
    const user = isReceived ? message.sender : message.recipient;
    const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Inconnu";

    return (
      <article key={message.id} className={`group rounded-2xl border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${isReceived && !message.isRead ? "border-primary/35 ring-1 ring-primary/10" : "border-border"}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
              {fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{isReceived ? "Expéditeur" : "Destinataire"}</p>
              <h3 className="mt-1 truncate text-base font-semibold text-foreground">{fullName}</h3>
              <p className="text-xs text-muted-foreground">{roleLabels[user?.role] || user?.role || "Utilisateur"}</p>
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <div>{new Date(message.createdAt).toLocaleDateString("fr-FR")}</div>
            {isReceived && !message.isRead && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 font-semibold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Non lu</span>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-border bg-muted px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Objet</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{message.title}</p>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">{message.content}</p>

        {message.attachments?.length ? (
          <div className="mt-5 rounded-xl border border-border bg-muted p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><Paperclip size={12} />Pièces jointes</p>
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => handleDownloadAttachment(attachment.id, attachment.originalName)}
                  className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-primary transition hover:border-primary hover:bg-primary-soft"
                >
                  {attachment.kind === "IMAGE" ? <Image size={14} /> : <FileText size={14} />}
                  <span className="max-w-[210px] truncate">{attachment.originalName}</span>
                  <Download size={13} />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isReceived && (
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => handleReadMessage(message)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              <Check size={15} /> Marquer lu
            </button>
            <button
              type="button"
              onClick={() => handleReply(message)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-deep"
            >
              <Reply size={15} /> Répondre
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-primary-deep px-5 py-6 text-primary-foreground shadow-primary sm:px-7">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary-soft"><Mail size={15} /> Messagerie EduAI</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Messages</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-soft/80">{isSuperAdmin ? "Échangez avec les administrateurs dont la demande a été acceptée." : "Échangez simplement avec les membres autorisés de votre espace."}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-medium text-white">
              {roleLabels[role] || "Utilisateur"}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-primary shadow-sm">
              <Inbox size={16} /> {totalUnread} non lus
            </div>
          </div>
          </div>
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
          <form onSubmit={handleSubmit} className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground"><SendHorizontal size={18} className="text-primary" /> Nouveau message</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><Users size={13} />
                {recipients.length} destinataires
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Destinataire</label>
                <select
                  value={form.recipientId}
                  onChange={(event) => setForm((current) => ({ ...current, recipientId: event.target.value }))}
                  className="input-field w-full rounded-lg px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">Sélectionner un destinataire</option>
                  {recipients.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} • {roleLabels[user.role] || user.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="input-field w-full rounded-lg px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Objet du message"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contenu</label>
                <textarea
                  rows={8}
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  className="input-field w-full rounded-lg px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Rédigez votre message..."
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Paperclip size={14} /> Pièces jointes</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                  onChange={(event) => setForm((current) => ({ ...current, attachments: Array.from(event.target.files || []) }))}
                  className="block w-full rounded-lg border border-dashed border-border-strong bg-muted px-3.5 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
                />
                {form.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.attachments.map((file, index) => (
                      <span key={`${file.name}-${index}`} className="max-w-full truncate rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
            {success && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{success}</p>}

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-primary transition hover:bg-primary-deep"
            >
              <Send size={16} /> Envoyer le message
            </button>
          </form>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("received")}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "received" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Inbox size={15} /> Reçus
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sent")}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === "sent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <SendHorizontal size={15} /> Envoyés
                </button>
              </div>

              <div className="relative w-full max-w-sm">
                <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    if (activeTab === "received") setInboxMeta((current) => ({ ...current, page: 1 }));
                    else setSentMeta((current) => ({ ...current, page: 1 }));
                  }}
                  placeholder="Rechercher un message..."
                  className="input-field w-full rounded-lg py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">Chargement des messages...</div>
            ) : (
              <div className="space-y-4">
                {currentMessages.length ? (
                  <>
                    {currentMessages.map((message) => renderMessageCard(message, activeTab === "received"))}

                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Page {currentMeta.page} / {currentMeta.totalPages}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextPage = Math.max(1, currentMeta.page - 1);
                            if (activeTab === "received") {
                              setInboxMeta((current) => ({ ...current, page: nextPage }));
                              loadMessages(searchTerm);
                            } else {
                              setSentMeta((current) => ({ ...current, page: nextPage }));
                              loadMessages(searchTerm);
                            }
                          }}
                          disabled={currentMeta.page <= 1}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Précédent
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextPage = Math.min(currentMeta.totalPages, currentMeta.page + 1);
                            if (activeTab === "received") {
                              setInboxMeta((current) => ({ ...current, page: nextPage }));
                              loadMessages(searchTerm);
                            } else {
                              setSentMeta((current) => ({ ...current, page: nextPage }));
                              loadMessages(searchTerm);
                            }
                          }}
                          disabled={currentMeta.page >= currentMeta.totalPages}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border-strong bg-muted p-8 text-center text-sm text-muted-foreground">
                    Aucun message trouvé pour cette recherche.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
