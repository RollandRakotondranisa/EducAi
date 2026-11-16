import { useMemo, useState } from "react";
import { Bot, Loader2, Send, Sparkles, ShieldCheck, Users, BookOpen, FileText, BarChart3 } from "lucide-react";
import MarkdownResponse from "@/components/MarkdownResponse";
import apiFetch from "@/utils/api";

const suggestions = [
  "Combien d’utilisateurs actifs avons-nous aujourd’hui ?",
  "Quels sont les demandes d’inscription en attente ?",
  "Fais-moi un rapport synthétique sur les cours et examens publiés.",
  "Montre-moi les derniers événements d’audit de la plateforme.",
  "Quels enseignants et étudiants sont les plus actifs ?",
];

export default function AdminAssistantPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour administrateur. Je peux analyser les utilisateurs, les cours, les examens, les demandes d’inscription et les événements d’audit pour vous produire des synthèses et des rapports.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const quickInsights = useMemo(
    () => [
      { label: "Sécurité", value: "Audit", icon: ShieldCheck },
      { label: "Utilisateurs", value: "Rôles", icon: Users },
      { label: "Pédagogie", value: "Cours", icon: BookOpen },
      { label: "Rapports", value: "Synthèse", icon: BarChart3 },
    ],
    [],
  );

  const sendMessage = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || sending) return;

    setMessage("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setSending(true);

    try {
      const response = await apiFetch("/ai/admin/chat", {
        method: "POST",
        body: { message: question },
      });

      const answer = response?.data?.response || response?.response || "Je n’ai pas pu formuler de réponse pour cette requête.";
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch (requestError) {
      setError(requestError.message || "L’assistant admin est indisponible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {quickInsights.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Suggestions</h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setMessage(suggestion)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition hover:border-primary hover:bg-primary-soft"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <h3 className="text-lg font-semibold">Assistant IA admin</h3>
          </div>

          <div className="flex min-h-[440px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3">
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${item.role === "user" ? "whitespace-pre-wrap bg-primary text-primary-foreground" : "bg-background text-foreground shadow-sm"}`}>
                    {item.role === "assistant" ? <MarkdownResponse>{item.text}</MarkdownResponse> : item.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Traitement en cours...
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Posez une question sur les utilisateurs, les cours, les examens ou l’audit..."
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                disabled={sending}
                maxLength={4000}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
                Envoyer
              </button>
            </form>

            {error && <p className="mt-3 text-sm text-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
