import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ListChecks, 
  Search, 
  Bell,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/* =========================================================
   DONNÉES MOCKÉES
   ========================================================= */

const upcomingExams = [
  { 
    id: 1, 
    title: "Algorithmique — Examen final", 
    code: "INF201",
    date: "12 août",
    time: "10:00",
    duration: "90 min",
    daysLeft: 3,
    status: "upcoming"
  },
  { 
    id: 2, 
    title: "Bases de données — Contrôle continu", 
    code: "INF204",
    date: "18 août",
    time: "14:00",
    duration: "60 min",
    daysLeft: 9,
    status: "upcoming"
  },
];

const courseProgress = [
  { name: "Algorithmique", progress: 82, chapters: 12, total: 15, trend: "up" },
  { name: "Bases de données", progress: 64, chapters: 8, total: 12, trend: "up" },
  { name: "Réseaux", progress: 45, chapters: 5, total: 11, trend: "stable" },
  { name: "Mathématiques", progress: 71, chapters: 9, total: 13, trend: "down" },
];

const recentGrades = [
  { course: "Algorithmique", assignment: "TD 3 - Complexité", grade: 16.5, max: 20, date: "5 août" },
  { course: "Bases de données", assignment: "Quiz SQL", grade: 14.0, max: 20, date: "2 août" },
  { course: "Réseaux", assignment: "TP 2 - Routage", grade: 12.5, max: 20, date: "28 juillet" },
];

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function ExamCard({ exam, index }) {
  const [isHovered, setIsHovered] = useState(false);

  const getUrgencyColor = () => {
    if (exam.daysLeft <= 3) return "bg-error-soft text-error border-error/20";
    if (exam.daysLeft <= 7) return "bg-warning-soft text-warning border-warning/20";
    return "bg-primary-soft text-primary border-primary/20";
  };

  const getUrgencyText = () => {
    if (exam.daysLeft <= 3) return `Dans ${exam.daysLeft} jours`;
    return exam.date;
  };

  return (
    <div
      className={`
        card-surface p-5 transition-all duration-300 hover:shadow-lg
        opacity-0 animate-[eduai-row-enter_0.4s_cubic-bezier(0.22,1,0.36,1)_forwards]
        ${isHovered ? "border-primary/30 -translate-y-1" : ""}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">
            {exam.title}
          </h3>
          <Badge className="bg-primary-soft text-primary border-0 text-xs">
            {exam.code}
          </Badge>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getUrgencyColor()}`}>
          {getUrgencyText()}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {exam.date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {exam.time} • {exam.duration}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {exam.daysLeft <= 3 ? (
            <AlertCircle className="size-4 text-error" />
          ) : (
            <CheckCircle2 className="size-4 text-success" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {exam.daysLeft <= 3 ? "Préparation urgente" : "Bien préparé"}
          </span>
        </div>
        <Button 
          size="sm" 
          className="rounded-lg h-8 group"
          asChild
        >
          <Link to={`/etudiant/examens/${exam.id}`}>
            Détails
            <ChevronRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ProgressCard({ course, index }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(course.progress);
    }, index * 150 + 300);
    return () => clearTimeout(timer);
  }, [course.progress, index]);

  const getTrendIcon = () => {
    if (course.trend === "up") return <TrendingUp className="size-3 text-success" />;
    if (course.trend === "down") return <TrendingUp className="size-3 text-error -rotate-180" />;
    return <div className="size-3 rounded-full bg-muted-foreground" />;
  };

  return (
    <div 
      className="space-y-3 opacity-0 animate-[eduai-row-enter_0.4s_cubic-bezier(0.22,1,0.36,1)_forwards]"
      style={{ animationDelay: `${index * 100 + 200}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{course.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="text-xs font-bold text-muted-foreground">
            {course.chapters}/{course.total} chapitres
          </span>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div 
          className={`
            absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out
            ${animatedProgress >= 70 ? "bg-success" : animatedProgress >= 50 ? "bg-primary" : "bg-warning"}
          `}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Progression</span>
        <span className="text-sm font-bold text-foreground">{animatedProgress}%</span>
      </div>
    </div>
  );
}

function GradeItem({ grade, index }) {
  const percentage = (grade.grade / grade.max) * 100;
  
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 opacity-0 animate-[eduai-row-enter_0.3s_ease_forwards]"
      style={{ animationDelay: `${index * 80 + 400}ms` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{grade.assignment}</p>
        <p className="text-xs text-muted-foreground">{grade.course} • {grade.date}</p>
      </div>
      <div className={`text-sm font-bold ml-4 px-2.5 py-1 rounded-lg ${
        percentage >= 80 ? "bg-success-soft text-success" :
        percentage >= 60 ? "bg-primary-soft text-primary" :
        "bg-warning-soft text-warning"
      }`}>
        {grade.grade}/{grade.max}
      </div>
    </div>
  );
}

/* =========================================================
   NAVIGATION ÉTUDIANT
   ========================================================= */

export const studentNav = [
  { to: "/etudiant", label: "Tableau de bord", icon: BookOpen, end: true },
  { to: "/etudiant/cours", label: "Mes cours", icon: FileText },
  { to: "/etudiant/ia", label: "Assistant IA", icon: Sparkles },
  { to: "/etudiant/messages", label: "Messages", icon: Bell },
  { to: "/etudiant/examens", label: "Examens", icon: ListChecks },
  { to: "/etudiant/resultats", label: "Résultats", icon: Award },
  { to: "/etudiant/profil", label: "Profil", icon: Sparkles },
];

/* =========================================================
   PAGE PRINCIPALE
   ========================================================= */

export default function StudentDashboard() {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(4);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppShell
      nav={studentNav}
      role="étudiant"
      title="Tableau de bord"
      subtitle="Votre progression pédagogique en un coup d'oeil."
    >
      {/* === HEADER ACTIONS === */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un cours, un examen..."
            className="input-field pl-10 pr-4 py-2 rounded-xl w-full"
          />
        </div>
        <button className="icon-button-pro relative">
          <Bell className="size-5" />
          {notifications > 0 && (
            <span className="notification-dot" />
          )}
        </button>
      </div>

      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard 
          label="Examens à venir" 
          value="2" 
          hint="le plus proche dans 3 jours" 
          icon={ListChecks}
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "0ms" }}
        />
        <StatCard 
          label="Cours suivis" 
          value="6" 
          hint="semestre en cours" 
          icon={BookOpen}
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "80ms" }}
        />
        <StatCard
          label="Moyenne générale"
          value="14,6"
          hint="+0,8 vs semestre dernier"
          icon={Award}
          accent="success"
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "160ms" }}
        />
        <StatCard
          label="Notifications"
          value="4"
          hint="2 feedbacks non lus"
          icon={Bell}
          accent="warning"
          className="stat-card-pro animate-[eduai-stat-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "240ms" }}
        />
      </div>

      {/* === CONTENT GRID === */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Examens à venir */}
        <SectionCard
          title="Examens à venir"
          description="Préparez vos prochaines évaluations"
          className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "300ms" }}
        >
          <div className="space-y-4">
            {upcomingExams.map((exam, index) => (
              <ExamCard key={exam.id} exam={exam} index={index} />
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4 rounded-lg hover:bg-primary-soft hover:text-primary transition-colors"
            asChild
          >
            <Link to="/etudiant/examens">
              Voir tous les examens
              <ChevronRight className="size-4 ml-2" />
            </Link>
          </Button>
        </SectionCard>

        {/* Progression par cours */}
        <SectionCard
          title="Progression par cours"
          description="Chapitres validés"
          className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
          style={{ animationDelay: "400ms" }}
        >
          <div className="space-y-5">
            {courseProgress.map((course, index) => (
              <ProgressCard key={course.name} course={course} index={index} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* === NOTES RÉCENTES === */}
      <SectionCard
        title="Dernières notes"
        description="Vos résultats récents"
        className="card-surface animate-[eduai-pop_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards] mt-6"
        style={{ animationDelay: "500ms" }}
      >
        <div className="space-y-2">
          {recentGrades.map((grade, index) => (
            <GradeItem key={index} grade={grade} index={index} />
          ))}
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-4 rounded-lg hover:bg-primary-soft hover:text-primary transition-colors"
          asChild
        >
          <Link to="/etudiant/resultats">
            Voir toutes les notes
            <ChevronRight className="size-4 ml-2" />
          </Link>
        </Button>
      </SectionCard>

      {/* === CONSEIL IA === */}
      <div className="rounded-xl bg-gradient-to-br from-primary-soft to-primary/5 p-5 border border-primary/10 mt-6 animate-[eduai-pop_0.5s_ease_forwards]" style={{ animationDelay: "600ms" }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-primary mb-1">Conseil personnalisé</h3>
            <p className="text-xs text-primary/80 leading-relaxed">
              Votre progression en <strong>Réseaux</strong> (45%) est en dessous de la moyenne. 
              Consacrez 2h cette semaine aux chapitres 6 et 7 pour rattraper le retard.
            </p>
            <Button size="sm" className="mt-3 rounded-lg h-8 text-xs bg-primary text-white hover:bg-primary-deep">
              Voir les chapitres à revoir
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
