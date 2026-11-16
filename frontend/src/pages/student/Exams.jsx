import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock, ListChecks, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import apiFetch from "@/utils/api";

const formatDate = (value) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Date non définie";

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const { examId } = useParams();

  useEffect(() => {
    Promise.all([apiFetch("/exams"), apiFetch("/exam-attempts/my-attempts")])
      .then(([examResponse, attemptResponse]) => { setExams(examResponse.data ?? []); setAttempts(attemptResponse.data ?? []); })
      .catch((loadError) => setError(loadError.message || "Impossible de charger les examens."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => exams.filter((exam) => {
    const attempt = attempts.find((item) => item.examId === exam.id);
    const status = attempt?.status === "SUBMITTED" || attempt?.status === "GRADED" ? "done" : attempt ? "started" : "available";
    return (filter === "all" || filter === status) && `${exam.title} ${exam.course?.name || ""} ${exam.course?.code || ""}`.toLowerCase().includes(search.toLowerCase());
  }), [exams, attempts, filter, search]);

  const selectedExam = exams.find((exam) => String(exam.id) === String(examId));
  const selectedAttempt = selectedExam && attempts.find((attempt) => attempt.examId === selectedExam.id);

  async function startAttempt() {
    if (!selectedExam) return;
    setStarting(true);
    try {
      const response = await apiFetch(`/exam-attempts/exam/${selectedExam.id}/start`, { method: "POST" });
      window.location.assign(`/etudiant/examens/${selectedExam.id}/passer?attempt=${response.data?.id || ""}`);
    } catch (startError) {
      setError(startError.message || "Impossible de démarrer l'examen.");
    } finally {
      setStarting(false);
    }
  }

  return <AppShell nav={studentNav} role="étudiant" title="Examens" subtitle="Examens publiés dans vos cours.">
    {error && <div className="rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert">{error}</div>}
    {loading ? <div className="flex min-h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement des examens...</div> : examId ? <SectionCard title={selectedExam?.title || "Examen introuvable"} description={selectedExam?.course?.name || ""}><div className="space-y-5"><Link to="/etudiant/examens" className="text-sm font-medium text-primary">Retour aux examens</Link>{selectedExam ? <><p className="text-sm text-muted-foreground">{selectedExam.description || "Aucune description."}</p><div className="grid gap-4 sm:grid-cols-3"><Info label="Cours" value={selectedExam.course?.code || "N/D"} /><Info label="Durée" value={`${selectedExam.duration} minutes`} /><Info label="Début" value={formatDate(selectedExam.startDate)} /></div><div className="flex justify-end"><Button type="button" onClick={startAttempt} disabled={starting || Boolean(selectedAttempt)}>{starting ? <Loader2 className="size-4 animate-spin" /> : null}{selectedAttempt ? selectedAttempt.status === "IN_PROGRESS" ? "Tentative en cours" : "Tentative terminée" : "Démarrer l'examen"}</Button></div></> : <p className="text-sm text-muted-foreground">Cet examen n'existe pas ou n'est plus accessible.</p>}</div></SectionCard> : <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3"><StatCard label="Examens disponibles" value={String(exams.length)} icon={ListChecks} /><StatCard label="Tentatives terminées" value={String(attempts.filter((item) => ["SUBMITTED", "GRADED"].includes(item.status)).length)} icon={Calendar} tone="success" /><StatCard label="En cours" value={String(attempts.filter((item) => item.status === "IN_PROGRESS").length)} icon={Clock} tone="warning" /></div>
      <SectionCard title="Mes examens"><div className="mb-5 flex flex-col gap-3 sm:flex-row"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un examen..." className="sm:max-w-md" /><div className="flex flex-wrap gap-2"><FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Tous</FilterButton><FilterButton active={filter === "available"} onClick={() => setFilter("available")}>Disponibles</FilterButton><FilterButton active={filter === "started"} onClick={() => setFilter("started")}>En cours</FilterButton><FilterButton active={filter === "done"} onClick={() => setFilter("done")}>Terminés</FilterButton></div></div>
        {filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Aucun examen correspondant.</p> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((exam) => { const attempt = attempts.find((item) => item.examId === exam.id); return <article key={exam.id} className="rounded-xl border border-border p-5"><div className="flex items-start justify-between gap-3"><div><Badge className="bg-primary-soft text-primary">{exam.course?.code || "Cours"}</Badge><h3 className="mt-3 font-semibold">{exam.title}</h3></div><span className="text-xs font-medium text-muted-foreground">{attempt ? attempt.status === "IN_PROGRESS" ? "En cours" : "Terminé" : "Disponible"}</span></div><p className="mt-3 text-sm text-muted-foreground">{exam.description || "Aucune description."}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span><Clock className="mr-1 inline size-3.5" />{exam.duration} min</span><span><Calendar className="mr-1 inline size-3.5" />{formatDate(exam.startDate)}</span></div><Button asChild className="mt-5 w-full"><Link to={`/etudiant/examens/${exam.id}`}>{attempt ? "Ouvrir la tentative" : "Voir l'examen"}<ArrowRight className="ml-2 size-4" /></Link></Button></article>; })}</div>}
      </SectionCard>
    </div>}
  </AppShell>;
}

function FilterButton({ active, onClick, children }) { return <button type="button" onClick={onClick} className={`rounded-lg border border-border px-3 py-2 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>{children}</button>; }
function Info({ label, value }) { return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
