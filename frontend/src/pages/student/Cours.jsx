import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { studentNav } from "./StudentNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import apiFetch from "@/utils/api";

/* =========================================================
  CARTE DE COURS
  ========================================================= */

const _legacyCourseShape = [
  {
    id: 1,
    name: "Algorithmique et Structures de Données",
    code: "INF201",
    teacher: "Dr. Sophie Martin",
    progress: 75,
    chapters: { completed: 9, total: 12 },
    nextDeadline: "Examen final",
    deadlineDate: "12 Août",
    daysLeft: 3,
    status: "active",
    color: "primary"
  },
  {
    id: 2,
    name: "Bases de Données Relationnelles",
    code: "INF204",
    teacher: "Prof. Thomas Dubois",
    progress: 64,
    chapters: { completed: 8, total: 12 },
    nextDeadline: "Projet SQL à rendre",
    deadlineDate: "18 Août",
    daysLeft: 9,
    status: "active",
    color: "success"
  },
  {
    id: 3,
    name: "Réseaux et Modèles OSI",
    code: "INF210",
    teacher: "Dr. Léa Bernard",
    progress: 45,
    chapters: { completed: 5, total: 11 },
    nextDeadline: "TP Noté : Routage",
    deadlineDate: "25 Août",
    daysLeft: 16,
    status: "warning",
    color: "warning"
  },
  {
    id: 4,
    name: "Mathématiques pour l'Informatique",
    code: "MATH101",
    teacher: "Prof. Lucas Petit",
    progress: 100,
    chapters: { completed: 10, total: 10 },
    nextDeadline: "Semestre terminé",
    deadlineDate: "15 Juin",
    daysLeft: 0,
    status: "completed",
    color: "muted"
  }
];

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function CourseCard({ course, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(course.progress);
    }, index * 150 + 300);
    return () => clearTimeout(timer);
  }, [course.progress, index]);

  const getStatusBadge = () => {
    switch (course.status) {
      case "active":
        return <span className="badge-role badge-role-student">En cours</span>;
      case "warning":
        return <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning border border-warning/20">
          <AlertCircle className="size-3" /> En retard
        </span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border">
          <CheckCircle2 className="size-3" /> Terminé
        </span>;
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    if (course.progress >= 70) return "bg-success";
    if (course.progress >= 50) return "bg-primary";
    return "bg-warning";
  };

  return (
    <div
      className={`
        request-card card-surface group h-full p-5 flex flex-col gap-4 transition-all duration-300
        opacity-0 animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]
        ${isHovered ? "shadow-lg -translate-y-1" : ""}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary-soft text-primary border-0 text-[10px] font-bold tracking-wider">
              {course.code}
            </Badge>
            {getStatusBadge()}
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground truncate leading-tight">
            {course.name}
          </h3>
        </div>
      </div>

      {/* Teacher Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4 shrink-0" />
        <span className="truncate">{course.teacher}</span>
      </div>

      {/* Progress Section */}
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Progression globale</span>
          <span className="text-foreground font-bold">{animatedProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground text-right">
          {course.chapters.completed} / {course.chapters.total} chapitres validés
        </p>
      </div>

      {/* Footer / Deadline */}
      <div className="mt-auto pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className={`size-4 shrink-0 ${course.daysLeft <= 3 && course.status === "active" ? "text-error" : "text-muted-foreground"}`} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{course.nextDeadline}</span>
              <span className="text-[10px] text-muted-foreground">{course.deadlineDate}</span>
            </div>
          </div>
          {course.daysLeft <= 3 && course.status === "active" && (
            <span className="text-[10px] font-bold text-error bg-error-soft px-2 py-0.5 rounded-full animate-pulse">
              Urgent
            </span>
          )}
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Button className="w-full rounded-lg group/btn" variant={course.status === "completed" ? "outline" : "default"} asChild>
            <Link to={`/etudiant/cours/${course.id}`}>
              {course.status === "completed" ? "Consulter les supports" : "Voire"}
              <ChevronRight className="size-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
          <Button className="w-full rounded-lg" variant="outline" asChild>
            <Link to={`/etudiant/ia/${course.id}`}><Sparkles className="size-4" />Assistance IA</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
   ========================================================= */

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    let active = true;
    apiFetch("/courses")
      .then((response) => {
        if (!active) return;
        setCourses((response.data ?? []).map((course) => ({
          id: course.id,
          name: course.name,
          code: course.code,
          teacher: [course.teacher?.firstName, course.teacher?.lastName].filter(Boolean).join(" ") || course.teacher?.email || "Enseignant",
          progress: 0,
          chapters: { completed: 0, total: 0 },
          nextDeadline: "Aucune échéance",
          deadlineDate: "",
          daysLeft: 0,
          status: "active",
          color: "primary",
        })));
      })
      .catch(() => { if (active) setCourses([]); });
    return () => { active = false; };
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCoursesCount = courses.filter(c => c.status === "active" || c.status === "warning").length;
  const avgProgress = courses.length ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length) : 0;

  return (
    <AppShell
      nav={studentNav}
      role="étudiant"
      title="Mes cours"
      subtitle="Vos cours du semestre en cours."
    >
      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard 
          label="Cours inscrits" 
          value={String(courses.length)} 
          hint={`${activeCoursesCount} en cours`}
          icon={BookOpen}
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "0ms" }}
        />
        <StatCard 
          label="Progression moyenne" 
          value={`${avgProgress}%`} 
          hint="Données de progression non disponibles"
          icon={TrendingUp}
          accent="success"
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "80ms" }}
        />
        <StatCard
          label="Échéances à venir"
          value="N/D"
          hint="Aucune échéance fournie par le backend"
          icon={Clock}
          accent="warning"
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "160ms" }}
        />
        <StatCard
          label="Moyenne générale"
          value="N/D"
          hint="Aucune note disponible"
          icon={Sparkles}
          accent="primary"
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "240ms" }}
        />
      </div>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard className="mb-6 animate-[eduai-pop_0.5s_ease_forwards]" style={{ animationDelay: "300ms" }}>
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher un cours par nom ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche de cours"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tous" },
              { value: "active", label: "En cours" },
              { value: "warning", label: "En difficulté" },
              { value: "completed", label: "Terminés" }
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`filter-btn rounded-lg border border-border px-4 py-2 text-sm font-medium transition ${
                  statusFilter === filter.value ? "active" : "bg-background hover:bg-muted"
                }`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* === LISTE DES COURS === */}
      <SectionCard
        title={`${filteredCourses.length} cours trouvé${filteredCourses.length > 1 ? "s" : ""}`}
        className="animate-[eduai-pop_0.5s_ease_forwards]"
        style={{ animationDelay: "400ms" }}
      >
        {filteredCourses.length === 0 ? (
          <div className="empty-state py-16 text-center">
            <div className="empty-state-icon mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary-soft">
              <BookOpen className="size-10 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
              Aucun cours ne correspond à votre recherche
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground mb-6">
              Essayez de modifier vos critères de recherche ou vos filtres pour trouver ce que vous cherchez.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                index={index} 
              />
            ))}
          </div>
        )}
      </SectionCard>

    </AppShell>
  );
}
