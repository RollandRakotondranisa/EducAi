import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import Home from "@/pages/Home";
import Connexion from "@/pages/connexion";
import Inscription from "@/pages/inscription";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { HomeRoute, PublicRoute } from "@/components/common/RouteGuards";
import { AppShell, adminNav } from "@/pages/admin/AppShell";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import UtilisateursPage from "@/pages/admin/utilisateurs";
import RapportsPage from "@/pages/admin/rapports.jsx.jsx";
import AdminAssistantPage from "@/pages/admin/AdminAssistantPage";
import ProfilPage from "@/pages/admin/profil";
import AuditPage from "@/pages/admin/audit";
import ParametresPage from "@/pages/admin/parametres";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import CoursesPage from "@/pages/teacher/CourseCard";
import DocumentsPage from "@/pages/teacher/DocumentCard";
import AiPage from "@/pages/teacher/AiPage";
import ExamsPage from "@/pages/teacher/ExamCard";
import ExamCorrectionPage from "@/pages/teacher/ExamCorrection";
import StudentsPage from "@/pages/teacher/StudentDetailModal";
import StatisticsPage from "@/pages/teacher/Statistics";
import TeacherProfilePage from "@/pages/teacher/profile";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentCoursesPage from "@/pages/student/Cours";
import StudentCourseDetail from "@/pages/student/CourseDetail";
import StudentExamsPage from "@/pages/student/Exams";
import TakeExam from "@/pages/student/TakeExam";
import StudentResultsPage from "@/pages/student/Results";
import StudentAiPage from "@/pages/student/AiPage";
import StudentProfilePage from "@/pages/student/profile";
import MessagesPage from "@/pages/common/MessagesPage";
import AnnouncementsPage from "@/pages/admin/AnnouncementsPage";
import DemandesAdminPage from "@/pages/admin/DemandesAdminPage";
import NotFound from "@/pages/NotFound";
import { getCurrentUserSession } from "@/utils/session";
import "./index.css";

function AdminLayout({ children, title = "Tableau de bord", subtitle = "Vue d'ensemble de la plateforme EduAI." }) {
  const session = getCurrentUserSession();
  const nav = session.user?.isSuperAdmin
    ? [
        ...adminNav.filter((item) => item.to !== "/admin/parametres"),
        { to: "/admin/demandes-admin", label: "Demandes admin", icon: ShieldCheck },
      ]
    : adminNav;
  return <AppShell nav={nav} role={session.role} userName={session.userName} title={title} subtitle={subtitle}>{children}</AppShell>;
}

function AdminRoutes() {
  const isSuperAdmin = Boolean(getCurrentUserSession().user?.isSuperAdmin);
  return <Routes>
    <Route index element={<AdminLayout title="Tableau de bord" subtitle={isSuperAdmin ? "Suivi des administrateurs dont la demande a été acceptée." : "Vue d'ensemble de la plateforme EduAI."}><AdminDashboard /></AdminLayout>} />
    <Route path="utilisateurs" element={<AdminLayout title="Gestion des utilisateurs" subtitle={isSuperAdmin ? "Administrateurs dont la demande d'inscription a été acceptée." : "Comptes, rôles et permissions."}><UtilisateursPage /></AdminLayout>} />
    <Route path="demandes-admin" element={isSuperAdmin ? <AdminLayout title="Demandes administrateur" subtitle="Validation des demandes d’accès aux établissements."><DemandesAdminPage /></AdminLayout> : <Navigate to="/admin" replace />} />
    <Route path="rapports" element={<AdminLayout title="Rapports" subtitle="Rapports générés par IA, export PDF et Excel."><RapportsPage /></AdminLayout>} />
    <Route path="assistant" element={<AdminLayout title="Assistant IA admin" subtitle="Recherchez dans les données de la plateforme et obtenez des synthèses opérationnelles."><AdminAssistantPage /></AdminLayout>} />
    <Route path="audit" element={<AdminLayout title="Audit" subtitle={isSuperAdmin ? "Activité concernant les administrateurs dont la demande a été acceptée." : "Historique des actions et traçabilité des utilisateurs."}><AuditPage /></AdminLayout>} />
    <Route path="messages" element={<AdminLayout title="Messagerie" subtitle={isSuperAdmin ? "Échangez avec les administrateurs dont la demande a été acceptée." : "Échangez avec les enseignants et les étudiants."}><MessagesPage /></AdminLayout>} />
    <Route path="annonces" element={<AdminLayout title="Annonces" subtitle={isSuperAdmin ? "Publiez des annonces à destination des administrateurs acceptés." : "Publiez des informations ciblées pour la communauté EduAI."}><AnnouncementsPage /></AdminLayout>} />
    <Route path="parametres" element={isSuperAdmin ? <Navigate to="/admin" replace /> : <AdminLayout title="Paramètres" subtitle="Configuration de la plateforme."><ParametresPage /></AdminLayout>} />
    <Route path="profil" element={<AdminLayout title="Profil" subtitle="Informations personnelles et sécurité du compte."><ProfilPage /></AdminLayout>} />
    <Route path="*" element={<AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme EduAI."><AdminDashboard /></AdminLayout>} />
  </Routes>;
}

function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomeRoute><Home /></HomeRoute>} />
    <Route path="/connexion" element={<PublicRoute><Connexion /></PublicRoute>} />
    <Route path="/inscription" element={<PublicRoute><Inscription /></PublicRoute>} />
    <Route path="/enseignant" element={<ProtectedRoute allowedRoles={["TEACHER"]}><TeacherDashboard /></ProtectedRoute>} />
    <Route path="/enseignant/cours" element={<ProtectedRoute allowedRoles={["TEACHER"]}><CoursesPage /></ProtectedRoute>} />
    <Route path="/enseignant/documents" element={<ProtectedRoute allowedRoles={["TEACHER"]}><DocumentsPage /></ProtectedRoute>} />
    <Route path="/enseignant/ia" element={<ProtectedRoute allowedRoles={["TEACHER"]}><AiPage /></ProtectedRoute>} />
    <Route path="/enseignant/ia/document/:documentId" element={<ProtectedRoute allowedRoles={["TEACHER"]}><AiPage /></ProtectedRoute>} />
    <Route path="/enseignant/examens" element={<ProtectedRoute allowedRoles={["TEACHER"]}><ExamsPage /></ProtectedRoute>} />
    <Route path="/enseignant/examens/:examId/correction" element={<ProtectedRoute allowedRoles={["TEACHER"]}><ExamCorrectionPage /></ProtectedRoute>} />
    <Route path="/enseignant/etudiants" element={<ProtectedRoute allowedRoles={["TEACHER"]}><StudentsPage /></ProtectedRoute>} />
    <Route path="/enseignant/statistiques" element={<ProtectedRoute allowedRoles={["TEACHER"]}><StatisticsPage /></ProtectedRoute>} />
    <Route path="/enseignant/profil" element={<ProtectedRoute allowedRoles={["TEACHER"]}><TeacherProfilePage /></ProtectedRoute>} />
    <Route path="/enseignant/parametres" element={<Navigate to="/enseignant" replace />} />
    <Route path="/enseignant/messages" element={<ProtectedRoute allowedRoles={["TEACHER"]}><MessagesPage /></ProtectedRoute>} />
    <Route path="/etudiant" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/etudiant/cours" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentCoursesPage /></ProtectedRoute>} />
    <Route path="/etudiant/cours/:id" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentCourseDetail /></ProtectedRoute>} />
    <Route path="/etudiant/examens" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentExamsPage /></ProtectedRoute>} />
    <Route path="/etudiant/examens/:examId" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentExamsPage /></ProtectedRoute>} />
    <Route path="/etudiant/examens/:examId/passer" element={<ProtectedRoute allowedRoles={["STUDENT"]}><TakeExam /></ProtectedRoute>} />
    <Route path="/etudiant/resultats" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentResultsPage /></ProtectedRoute>} />
    <Route path="/etudiant/ia/:courseId" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentAiPage /></ProtectedRoute>} />
    <Route path="/etudiant/messages" element={<ProtectedRoute allowedRoles={["STUDENT"]}><MessagesPage /></ProtectedRoute>} />
    <Route path="/etudiant/profil" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentProfilePage /></ProtectedRoute>} />
    <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={["ADMIN"]}><MessagesPage /></ProtectedRoute>} />
    <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminRoutes /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter>;
}

export default App;
