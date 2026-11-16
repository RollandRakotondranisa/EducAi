import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ListChecks, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Users
} from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { StatCard, SectionCard, StatusBadge } from "@/components/kit";
import { BarChart, PieChart } from "@/components/teacherCharts";
import { Button } from "@/components/ui/Button";
import apiFetch from "@/utils/api";
import { fetchCourses, fetchDocumentsForCourses, fetchStudentsForCourses, formatDate } from "@/utils/academic";
import AnnouncementsPanel from "@/components/AnnouncementsPanel";

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function AnalysisItem({ analysis, index }) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPct(analysis.pct);
    }, index * 150 + 300);
    return () => clearTimeout(timer);
  }, [analysis.pct, index]);

  const getStatusIcon = () => {
    switch (analysis.status) {
      case "valide":
        return <CheckCircle2 className="size-4 text-success" />;
      case "encours":
        return <Loader2 className="size-4 text-primary animate-spin" />;
      case "erreur":
        return <AlertCircle className="size-4 text-error" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (analysis.status) {
      case "valide":
        return "bg-success";
      case "encours":
        return "bg-primary";
      case "erreur":
        return "bg-error";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <li 
      className="space-y-2 opacity-0 animate-[eduai-row-enter_0.4s_cubic-bezier(0.22,1,0.36,1)_forwards]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getStatusIcon()}
          <p className="truncate text-sm font-medium text-foreground">
            {analysis.doc}
          </p>
        </div>
        <StatusBadge status={analysis.status} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getStatusColor()}`}
            style={{ width: `${animatedPct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0 w-10 text-right">
          {animatedPct}%
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">{analysis.time}</p>
    </li>
  );
}

/* =========================================================
   PAGE PRINCIPALE
   ========================================================= */

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCourses(), apiFetch("/exams")])
      .then(async ([loadedCourses, examResponse]) => {
        const [loadedDocuments, loadedStudents] = await Promise.all([
          fetchDocumentsForCourses(loadedCourses),
          fetchStudentsForCourses(loadedCourses),
        ]);
        if (!active) return;
        setCourses(loadedCourses);
        setDocuments(loadedDocuments);
        setStudents(loadedStudents);
        setExams(examResponse.data ?? []);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const recentItems = [
    ...courses.map((course) => ({ type: "course", title: "Cours créé", desc: course.name, date: course.createdAt, icon: BookOpen, color: "bg-primary-soft text-primary" })),
    ...documents.map((document) => ({ type: "document", title: "Document déposé", desc: document.originalName, date: document.createdAt, icon: FileText, color: "bg-success-soft text-success" })),
    ...exams.map((exam) => ({ type: "exam", title: `Examen ${exam.status === "PUBLISHED" ? "publié" : "créé"}`, desc: exam.title, date: exam.createdAt, icon: ListChecks, color: "bg-warning-soft text-warning" })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6);

  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Tableau de bord"
    >
      {/* === HEADER ACTIONS === */}
      <div className="flex justify-end mb-4">
        <Button asChild className="rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <Link to="/enseignant/documents">
            <Plus className="size-4" /> 
            Déposer un document
          </Link>
        </Button>
      </div>

      <AnnouncementsPanel />

      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard 
          label="Mes cours" 
          value={String(courses.length)} 
          hint="Cours sous votre responsabilité" 
          icon={BookOpen}
          className="stat-card animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "0ms" }}
        />
        <StatCard 
          label="Documents déposés" 
          value={String(documents.length)} 
          hint="Documents de vos cours" 
          icon={FileText}
          className="stat-card animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "80ms" }}
        />
        <StatCard
          label="Étudiants associés"
          value={String(new Set(students.map((student) => student.id)).size)}
          hint={`${students.length} association${students.length > 1 ? "s" : ""} étudiant-cours`}
          icon={Users}
          tone="success"
          className="stat-card animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "160ms" }}
        />
        <StatCard
          label="Questions à valider"
          value="0"
          hint="Aucune donnée disponible"
          icon={Sparkles}
          tone="destructive"
          className="stat-card animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "240ms" }}
        />
        <StatCard
          label="Examens publiés"
          value={String(exams.filter((exam) => exam.status === "PUBLISHED").length)}
          hint="Examens publiés"
          icon={ListChecks}
          tone="success"
          className="stat-card animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "320ms" }}
        />
      </div>

      {/* === GRAPHIQUES ET ANALYSES === */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mt-6">
        <SectionCard
          title="Inscriptions par cours"
          description="Nombre d'étudiants associés à chaque cours"
        >
          <BarChart courses={courses.slice(0, 6)} />
        </SectionCard>

        <SectionCard
          title="Répartition des ressources"
          description="Cours, documents et examens enregistrés"
        >
          <PieChart data={[
            { label: "Cours", value: courses.length, color: "#2563eb" },
            { label: "Documents", value: documents.length, color: "#16a34a" },
            { label: "Examens", value: exams.length, color: "#d97706" },
          ]} />
        </SectionCard>

        {/* Cours réels */}
        <SectionCard
          title="Vos cours"
          description="Cours et inscriptions enregistrés dans la base"
          className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "300ms" }}
        >
          {loading ? <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div> : courses.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucun cours enregistré.</p>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 6).map((course) => (
                <div key={course.id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{course.name}</p><p className="text-xs text-muted-foreground">{course.code}</p></div>
                  <span className="shrink-0 text-sm font-medium text-primary">{course.enrolledStudentCount} étudiant{course.enrolledStudentCount > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Analyses IA */}
        <SectionCard
          title="Analyses IA en cours"
          description="Progression du traitement des documents"
          className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "400ms" }}
        >
          <ul className="space-y-5">
            {documents.length === 0 ? <li className="py-12 text-center text-sm text-muted-foreground">Aucun document enregistré.</li> : documents.slice(0, 4).map((document, index) => (
              <AnalysisItem key={document.id} analysis={{
                doc: document.originalName,
                pct: String(document.status).toUpperCase() === "PROCESSED" ? 100 : 0,
                status: String(document.status).toUpperCase() === "PROCESSED" ? "valide" : "encours",
                time: formatDate(document.createdAt),
              }} index={index} />
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-border/50">
            <Button 
              asChild 
              variant="ghost" 
              size="sm" 
              className="w-full rounded-lg hover:bg-primary-soft hover:text-primary transition-colors"
            >
              <Link to="/enseignant/ia">
                Voir toutes les analyses
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* === SECTION SUPPLÉMENTAIRE : ACTIVITÉ RÉCENTE === */}
      <SectionCard
        title="Activité récente"
        description="Dernières actions sur vos cours"
        className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards] mt-6"
        style={{ animationDelay: "500ms" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((activity, i) => (
            <div 
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 opacity-0 animate-[eduai-row-enter_0.4s_ease_forwards]"
              style={{ animationDelay: `${600 + i * 100}ms` }}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.color} shrink-0`}>
                <activity.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </TeacherShell>
  );
}
