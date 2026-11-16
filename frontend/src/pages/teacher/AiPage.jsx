import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, FileText, Loader2, Send, Sparkles, User } from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import MarkdownResponse from "@/components/MarkdownResponse";
import apiFetch from "@/utils/api";
import { fetchCourses, fetchDocumentsForCourses } from "@/utils/academic";

function formatSize(size) {
  if (!size) return "Taille inconnue";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = Number(size);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

export default function AiPage() {
  const { documentId } = useParams();
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchCourses()]).then(async ([loadedCourses]) => {
      const loadedDocuments = await fetchDocumentsForCourses(loadedCourses);
      if (!active) return;
      setCourses(loadedCourses);
      setDocuments(loadedDocuments);
      const routedDocument = loadedDocuments.find((document) => String(document.id) === String(documentId));
      setSelectedCourseId(String(routedDocument?.courseId || loadedCourses[0]?.id || ""));
      setSelectedDocumentId(String(routedDocument?.id || ""));
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Impossible de charger vos cours.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [documentId]);

  const courseDocuments = useMemo(
    () => documents.filter((document) => String(document.courseId) === String(selectedCourseId)),
    [documents, selectedCourseId],
  );

  useEffect(() => {
    if (!documentId) setSelectedDocumentId("");
  }, [selectedCourseId, documentId]);

  const selectedCourse = courses.find((course) => String(course.id) === String(selectedCourseId));
  const selectedDocument = courseDocuments.find((document) => String(document.id) === String(selectedDocumentId));

  const sendMessage = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || sending) return;
    setMessage("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setSending(true);
    try {
      const response = await apiFetch(selectedDocumentId ? `/ai/documents/${selectedDocumentId}/chat` : "/ai/chat", {
        method: "POST",
        body: {
          message: question,
          ...(!selectedDocumentId && {
            courseId: selectedCourseId || undefined,
          }),
        },
      });
      setMessages((current) => [...current, {
        role: "assistant",
        text: response.data?.response || "L'IA n'a pas retourné de réponse.",
      }]);
    } catch (requestError) {
      setError(requestError.message || "Le chatbot est indisponible.");
    } finally {
      setSending(false);
    }
  };

  const reindexDocument = async () => {
    if (!selectedDocumentId || reindexing) return;
    setReindexing(true);
    setError("");
    try {
      await apiFetch(`/documents/${selectedDocumentId}/reindex`, { method: "POST" });
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Impossible de réindexer le document.");
    } finally {
      setReindexing(false);
    }
  };

  return (
    <TeacherShell nav={teacherNav} role="enseignant" title="Assistant IA" subtitle={selectedDocument ? `Document : ${selectedDocument.originalName}` : "Interrogez les informations de vos cours et documents."}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionCard title="Votre espace pédagogique" description="Données chargées depuis votre compte">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Chargement...</div>
          ) : (
            <div className="space-y-5">
              <label className="block text-sm font-medium text-foreground">Cours
                <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Sélectionner un cours</option>
                  {courses.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.code})</option>)}
                </select>
              </label>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary" /> {selectedCourse?.name || "Aucun cours sélectionné"}</div>
                <p className="mt-2 text-sm text-muted-foreground">{selectedCourse?.description || "Aucune description enregistrée."}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents ({courseDocuments.length})</p>
                <div className="space-y-2">
                  {courseDocuments.length ? courseDocuments.map((document) => (
                    <button key={document.id} type="button" onClick={() => setSelectedDocumentId(String(document.id))} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm ${String(document.id) === String(selectedDocumentId) ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                      <FileText className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{document.originalName}</span><span className="text-xs text-muted-foreground">{formatSize(document.fileSize)}</span>
                    </button>
                  )) : <p className="text-sm text-muted-foreground">Aucun document dans ce cours.</p>}
                </div>
              </div>
              {selectedDocument && <p className="text-xs text-muted-foreground">Document ciblé : {selectedDocument.originalName}</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Chatbot IA" description={selectedDocument ? `Assistant dédié à ${selectedDocument.originalName}` : "Réponses fondées sur les cours et documents qui vous appartiennent"}>
          <div className="flex min-h-[420px] flex-col">
            {selectedDocument && <div className="mb-4 flex flex-wrap gap-2">
              {["Résumer ce document", "Quels sont les concepts principaux ?", "Quels sont les points importants ?", "Quels sont les points faibles de ce document ?", "Est-ce que ce document est bien structuré ?", "Quels objectifs pédagogiques peut-on tirer de ce document ?", "Générer des idées de questions"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setMessage(suggestion)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:bg-primary-soft hover:text-primary">{suggestion}</button>)}
            </div>}
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-4">
              {!messages.length && <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground"><Sparkles className="mb-3 size-8 text-primary" /><p>Posez une question sur vos cours, vos documents ou leur organisation.</p></div>}
              {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex gap-2 ${item.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${item.role === "user" ? "bg-primary text-primary-foreground" : "bg-background text-foreground shadow-sm"}`}><div className="mb-1 flex items-center gap-1 text-xs font-semibold opacity-70">{item.role === "user" ? <User className="size-3" /> : <Sparkles className="size-3" />}{item.role === "user" ? "Vous" : "EduAI"}</div>{item.role === "assistant" ? <MarkdownResponse>{item.text}</MarkdownResponse> : <p className="whitespace-pre-wrap">{item.text}</p>}</div></div>)}
              {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> L'IA prépare une réponse...</div>}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} placeholder="Posez votre question..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" disabled={sending} />
              <Button type="submit" disabled={sending || !message.trim()} aria-label="Envoyer la question"><Send className="size-4" /></Button>
            </form>
            {error && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-error" role="alert"><span>{error}</span>{selectedDocument && <Button type="button" variant="outline" size="sm" onClick={reindexDocument} disabled={reindexing}>{reindexing ? "Indexation..." : "Réindexer le document"}</Button>}</div>}
          </div>
        </SectionCard>
      </div>
    </TeacherShell>
  );
}
