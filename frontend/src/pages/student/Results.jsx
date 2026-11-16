import { useEffect, useMemo, useState } from "react";
import { Award, Calendar, FileText, Loader2, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import apiFetch from "@/utils/api";

const date = (value) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "Date non définie";

export default function StudentResultsPage() {
  const [attempts, setAttempts] = useState([]);
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/exam-attempts/my-results"),
      apiFetch("/exam-attempts/my-attempts"),
    ])
      .then(([resultsResponse, attemptsResponse]) => {
        setAttempts(resultsResponse.data ?? []);
        setPendingAttempts((attemptsResponse.data ?? []).filter((attempt) => attempt.status === "SUBMITTED"));
      })
      .catch((loadError) => setError(loadError.message || "Impossible de charger vos résultats."))
      .finally(() => setLoading(false));
  }, []);

  const graded = attempts;
  const average = graded.length ? (graded.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / graded.length).toFixed(2) : null;
  const best = graded.length ? Math.max(...graded.map((attempt) => Number(attempt.score || 0))) : null;
  const filtered = useMemo(() => attempts.filter((attempt) => `${attempt.exam?.title || ""} ${attempt.exam?.course?.name || ""}`.toLowerCase().includes(search.toLowerCase())), [attempts, search]);

  return <AppShell nav={studentNav} role="étudiant" title="Résultats" subtitle="Vos tentatives et notes disponibles.">
    {error && <div className="rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert">{error}</div>}
    {loading ? <div className="flex min-h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement des résultats...</div> : <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-4"><StatCard label="Résultats enregistrés" value={String(attempts.length)} icon={FileText} /><StatCard label="En attente de correction" value={String(pendingAttempts.length)} icon={Clock} tone="warning" /><StatCard label="Notes disponibles" value={String(graded.length)} icon={Award} tone="success" /><StatCard label="Moyenne" value={average === null ? "N/D" : `${average}/20`} hint="Calculée sur les tentatives notées" icon={Award} tone="primary" /></div>
      {pendingAttempts.length > 0 && <SectionCard title="En attente de correction"><div className="space-y-3">{pendingAttempts.map((attempt) => <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div><p className="font-semibold">{attempt.exam?.title || "Examen"}</p><p className="mt-1 text-sm text-muted-foreground">{attempt.exam?.course?.name || "Cours"}</p></div><span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">Votre copie a été soumise</span></div>)}</div></SectionCard>}
      <SectionCard title="Mes résultats"><div className="mb-5 max-w-md"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un examen..." /></div>{filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Aucun résultat disponible.</p> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((result) => <article key={result.id} className="rounded-xl border border-border p-5"><div className="flex items-start justify-between gap-3"><div><Badge className={result.status === "ABSENT" ? "bg-error-soft text-error" : "bg-success-soft text-success"}>{result.status === "ABSENT" ? "Absent" : "Présent"}</Badge><h3 className="mt-3 font-semibold">{result.exam?.title || "Examen"}</h3><p className="mt-1 text-sm text-muted-foreground">{result.exam?.course?.name || "Cours"}</p></div><div className="text-right"><strong className="text-2xl text-primary">{result.score}/{result.totalPoints || 20}</strong><p className="text-sm text-muted-foreground">{Number(result.percentage).toFixed(0)}%</p></div></div><p className="mt-4 text-xs text-muted-foreground">{result.totalQuestions} question(s) · {result.unansweredQuestions} sans réponse</p><p className="mt-2 text-xs text-muted-foreground"><Calendar className="mr-1 inline size-3.5" />{result.status === "ABSENT" ? "Aucune participation" : `Soumis le ${date(result.submittedAt)}`}</p>{result.attempt?.answers?.length > 0 && <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium text-primary">Voir la correction détaillée</summary><div className="mt-3 space-y-3">{result.attempt.answers.map((answer) => <div key={answer.id} className="rounded-lg bg-muted p-3"><p className="text-sm font-medium">{answer.question?.question || "Question"}</p><p className="mt-1 text-xs text-muted-foreground">Votre réponse : {answer.selectedOption || answer.answerText || "Aucune réponse"} · {answer.pointsObtained}/{answer.question?.points ?? 0} pt</p>{answer.feedback && <p className="mt-2 text-sm">{answer.feedback}</p>}</div>)}</div></details>}</article>)}</div>}</SectionCard>
      {best !== null && <p className="text-sm text-muted-foreground">Meilleure note : <strong className="text-foreground">{best}/20</strong></p>}
    </div>}
  </AppShell>;
}
