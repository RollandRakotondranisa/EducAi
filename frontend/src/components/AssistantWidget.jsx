import { useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import MarkdownResponse from "@/components/MarkdownResponse";
import apiFetch from "@/utils/api";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || sending) return;
    setMessage("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setSending(true);
    try {
      const response = await apiFetch("/ai/chat", {
        method: "POST",
        body: { message: question },
      });
      setMessages((current) => [...current, {
        role: "assistant",
        text: response.data?.response || "L'IA n'a pas retourné de réponse.",
      }]);
    } catch (requestError) {
      setError(requestError.message || "L'assistant est indisponible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-4 z-50 flex h-[min(30rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:right-6" aria-label="Assistant IA">
          <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2"><Bot className="size-5" /><div><p className="font-semibold">Assistant IA</p><p className="text-xs opacity-80">Vos données et vos questions générales</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant" className="grid size-8 place-items-center rounded-lg hover:bg-white/15"><X className="size-4" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
            {!messages.length && <p className="py-8 text-center text-sm text-muted-foreground">Demandez vos cours, vos examens ou une information générale.</p>}
            {messages.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${item.role === "user" ? "whitespace-pre-wrap bg-primary text-primary-foreground" : "bg-card text-foreground shadow-sm"}`}>{item.role === "assistant" ? <MarkdownResponse>{item.text}</MarkdownResponse> : item.text}</div></div>)}
            {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Réponse en cours...</div>}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-3">
            <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} placeholder="Écrire une question..." aria-label="Question à l'assistant" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" disabled={sending} />
            <button type="submit" disabled={sending || !message.trim()} aria-label="Envoyer" className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4" /></button>
          </form>
          {error && <p className="px-3 pb-3 text-xs text-error">{error}</p>}
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"} title="Assistant IA" className="fixed bottom-5 right-4 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:right-6"><Bot className="size-6" /></button>
    </>
  );
}
