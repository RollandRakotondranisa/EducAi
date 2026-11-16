import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Calendar, Clock, FileText, ListChecks, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";
import AnnouncementsPanel from "@/components/AnnouncementsPanel";

const formatDate = (value) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Date non définie";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/courses"), apiFetch("/exams"), apiFetch("/exam-attempts/my-attempts")])
      .then(([courseResponse, examResponse, attemptResponse]) => { setCourses(courseResponse.data ?? []); setExams(examResponse.data ?? []); setAttempts(attemptResponse.data ?? []); })
      .catch((loadError) => setError(loadError.message || "Impossible de charger le tableau de bord."))
      .finally(() => setLoading(false));
  }, []);

  const upcomingExams = useMemo(() => exams.filter((exam) => !attempts.some((attempt) => attempt.examId === exam.id && ["SUBMITTED", "GRADED"].includes(attempt.status))).slice(0, 4), [exams, attempts]);
  const graded = attempts.filter((attempt) => attempt.status === "GRADED");
  const average = graded.length ? (graded.reduce((sum, item) => sum + Number(item.score || 0), 0) / graded.length).toFixed(1) : null;

  return <AppShell nav={studentNav} role="étudiant" title="Tableau de bord" subtitle="Vue d'ensemble de vos données universitaires.">
    {error && <div className="rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert">{error}</div>}
    <AnnouncementsPanel />
    {loading ? <div className="flex min-h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement du tableau de bord...</div> : <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Cours suivis" value={String(courses.length)} icon={BookOpen} /><StatCard label="Examens à préparer" value={String(upcomingExams.length)} icon={ListChecks} tone="warning" /><StatCard label="Tentatives" value={String(attempts.length)} icon={FileText} /><StatCard label="Moyenne" value={average === null ? "N/D" : `${average}/20`} hint="Notes disponibles uniquement" icon={BookOpen} tone="success" /></div>
      <div className="grid gap-6 lg:grid-cols-2"><SectionCard title="Examens à venir" description="Examens publiés dans vos cours.">{upcomingExams.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun examen à préparer.</p> : <div className="space-y-3">{upcomingExams.map((exam) => <div key={exam.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{exam.title}</p><p className="mt-1 text-xs text-muted-foreground"><Clock className="mr-1 inline size-3.5" />{exam.duration} min · {formatDate(exam.startDate)}</p></div><Button asChild size="sm"><Link to={`/etudiant/examens/${exam.id}`}>Détails<ArrowRight className="ml-1 size-4" /></Link></Button></div>)}</div>}</SectionCard><SectionCard title="Mes cours" description="Cours récupérés depuis la base de données.">{courses.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Vous n'êtes inscrit à aucun cours.</p> : <div className="space-y-3">{courses.slice(0, 5).map((course) => <Link key={course.id} to={`/etudiant/cours/${course.id}`} className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/40"><div><p className="text-sm font-semibold">{course.name}</p><p className="text-xs text-muted-foreground">{course.code} · {course.teacher ? `${course.teacher.firstName || ""} ${course.teacher.lastName || ""}` : "Enseignant"}</p></div><Calendar className="size-4 text-primary" /></Link>)}</div>}</SectionCard></div>
    </div>}
  </AppShell>;
}
