import { useEffect, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import MarkdownResponse from "@/components/MarkdownResponse";
import apiFetch from "@/utils/api";
import { fetchCourses } from "@/utils/academic";
import { studentNav } from "./StudentNav";

export default function StudentAiPage() {
  const { courseId } = useParams();
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCourses()
      .then((loadedCourses) => {
        if (!active) return;
        setCourses(loadedCourses);
      })
      .catch((requestError) => active && setError(requestError.message || "Impossible de charger vos cours."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));

  const sendMessage = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || sending) return;
    setMessage("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setSending(true);
    try {
      const response = await apiFetch(`/ai/courses/${courseId}/chat`, {
        method: "POST",
        body: { message: question },
      });
      setMessages((current) => [...current, {
        role: "assistant",
        text: response.data?.response || "Je n'ai trouvé aucun résultat correspondant.",
        sources: response.data?.sources || [],
      }]);
    } catch (requestError) {
      setError(requestError.message || "L'assistant est indisponible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell nav={studentNav} role="étudiant" title="Assistance IA" subtitle={`Cours : ${selectedCourse?.name || "Cours sélectionné"}`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionCard title="Cours sélectionné" description="La recherche porte uniquement sur les documents de ce cours.">
          {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement...</div> : <div className="space-y-3">
            <p className="text-lg font-semibold">{selectedCourse?.name || "Cours introuvable"}</p>
            <p className="text-sm text-muted-foreground">{selectedCourse?.code || ""}</p>
            <p className="text-xs text-muted-foreground">Les permissions d’inscription sont vérifiées côté serveur avant toute recherche RAG.</p>
          </div>}
        </SectionCard>

        <SectionCard title="Conversation" description="Les notes et statistiques sont récupérées depuis la base de données.">
          <div className="flex min-h-[420px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-4">
              {!messages.length && <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground"><Sparkles className="mb-3 size-8 text-primary" /><p>Demandez vos cours, vos examens, vos résultats ou une notion du document sélectionné.</p></div>}
              {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${item.role === "user" ? "whitespace-pre-wrap bg-primary text-primary-foreground" : "bg-background shadow-sm"}`}>{item.role === "assistant" ? <MarkdownResponse>{item.text}</MarkdownResponse> : item.text}{item.sources?.length > 0 && <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">Sources : {item.sources.map((source) => source.document_name).filter(Boolean).join(", ")}</p>}</div></div>)}
              {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Réponse en cours...</div>}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} placeholder="Posez votre question..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" disabled={sending} />
              <Button type="submit" disabled={sending || !message.trim()} aria-label="Envoyer"><Send className="size-4" /></Button>
            </form>
            {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
