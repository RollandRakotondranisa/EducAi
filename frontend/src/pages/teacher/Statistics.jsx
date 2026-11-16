import { useEffect, useMemo, useState } from "react";
import { BookOpen, FileText, GraduationCap, Loader2, ListChecks, Users } from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard, StatCard } from "@/components/kit";
import { BarChart, PieChart } from "@/components/teacherCharts";
import { fetchCourses, fetchDocumentsForCourses, fetchStudentsForCourses, formatDate } from "@/utils/academic";
import apiFetch from "@/utils/api";

export default function StatisticsPage() {
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setExams(examResponse.data ?? []);
        setStudents(loadedStudents);
      })
      .catch((loadError) => active && setError(loadError.message || "Impossible de charger les statistiques."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  const uniqueStudents = useMemo(() => new Set(students.map((student) => student.id)).size, [students]);
  const publishedExams = exams.filter((exam) => exam.status === "PUBLISHED").length;
  const processedDocuments = documents.filter((document) => String(document.status).toUpperCase() === "PROCESSED").length;
  const documentStorage = documents.reduce((total, document) => total + (Number(document.fileSize) || 0), 0);
  const recentCourses = [...courses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6);

  return (
    <TeacherShell nav={teacherNav} role="enseignant" title="Statistiques" subtitle="Indicateurs calculés à partir de vos données EduAI.">
      {error && <div className="rounded-xl border border-error/20 bg-error-soft p-4 text-sm font-medium text-error" role="alert">{error}</div>}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Chargement des statistiques...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Cours" value={String(courses.length)} icon={BookOpen} tone="primary" />
            <StatCard label="Étudiants inscrits" value={String(uniqueStudents)} icon={Users} tone="success" />
            <StatCard label="Associations étudiant-cours" value={String(students.length)} icon={Users} tone="primary" />
            <StatCard label="Documents" value={String(documents.length)} hint={`${processedDocuments} traités`} icon={FileText} tone="primary" />
            <StatCard label="Examens publiés" value={String(publishedExams)} icon={ListChecks} tone="warning" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Inscriptions par cours" description="Nombre d'étudiants associés à chaque cours.">
              <BarChart courses={recentCourses} />
            </SectionCard>

            <SectionCard title="Répartition des ressources" description="Part de chaque type de ressource enregistrée.">
              <PieChart data={[
                { label: "Cours", value: courses.length, color: "#2563eb" },
                { label: "Documents", value: documents.length, color: "#16a34a" },
                { label: "Examens", value: exams.length, color: "#d97706" },
              ]} />
            </SectionCard>

            <SectionCard title="Activité des ressources" description="Répartition des éléments réellement enregistrés.">
              <div className="space-y-5">
                <Metric label="Cours" value={courses.length} total={Math.max(courses.length, 1)} color="bg-primary" />
                <Metric label="Documents traités" value={processedDocuments} total={Math.max(documents.length, 1)} color="bg-success" />
                <Metric label="Examens publiés" value={publishedExams} total={Math.max(exams.length, 1)} color="bg-warning" />
                <div className="flex items-center justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Stockage utilisé</span><strong>{formatBytes(documentStorage)}</strong></div>
              </div>
            </SectionCard>

            <SectionCard title="Cours les plus suivis" description="Nombre d'inscriptions connues par cours.">
              {recentCourses.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun cours enregistré.</p> : (
                <div className="space-y-3">
                  {recentCourses.map((course) => <div key={course.id} className="flex items-center justify-between rounded-xl border border-border p-4"><div className="flex min-w-0 items-center gap-3"><GraduationCap className="size-5 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{course.name}</p><p className="text-xs text-muted-foreground">{course.code}</p></div></div><span className="text-sm font-semibold text-primary">{course.enrolledStudentCount}</span></div>)}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Dernières données enregistrées" description="Cours, documents et examens provenant de la base.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...courses.map((item) => ({ ...item, kind: "Cours", label: item.name })), ...documents.map((item) => ({ ...item, kind: "Document", label: item.originalName })), ...exams.map((item) => ({ ...item, kind: "Examen", label: item.title }))]
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .slice(0, 9)
                .map((item) => <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.kind}</p><p className="mt-1 truncate text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p></div>)}
            </div>
          </SectionCard>
        </div>
      )}
    </TeacherShell>
  );
}

function Metric({ label, value, total, color }) {
  const percentage = Math.min(100, Math.round((value / total) * 100));
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div></div>;
}

function formatBytes(bytes) {
  if (!bytes) return "0 octet";
  const units = ["octets", "Ko", "Mo", "Go"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}
