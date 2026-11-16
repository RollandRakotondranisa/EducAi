import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  Users, 
  AlertCircle, 
  Search, 
  Eye, 
  Mail, 
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Loader2
} from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard, StatCard, EmptyState } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchCourses, fetchStudentsForCourses, fetchStudentsForTeacher } from "@/utils/academic";

/* =========================================================
   COMPOSANTS INTERNES & HELPERS
   ========================================================= */

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeXml(value = "") {
  return String(value).replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "\"": "&quot;",
    "'": "&apos;",
  })[character]);
}

function fitCardText(value, maxLength) {
  const text = String(value || "Non renseigné");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function StudentDetailModal({ student, close, onDownloadCard }) {
  if (!student) return null;

  return (
    <div 
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      onClick={close}
    >
      <div 
        className="modal-content card-surface w-full max-w-lg p-6 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h2 className="font-display text-xl font-semibold">Profil de l'étudiant</h2>
          <button onClick={close} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col items-center pb-6">
          <div className="avatar mb-4" style={{ width: 72, height: 72, fontSize: "1.5rem" }}>
            {student.avatar ? (
              <img src={student.avatar} alt={`Photo de ${student.name}`} className="size-full rounded-full object-cover" />
            ) : getInitials(student.name)}
          </div>
          <h3 className="font-display text-lg font-semibold">{student.name}</h3>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>

        <div className="space-y-4 rounded-xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cours</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              <BookOpen className="size-3" />
              {student.course}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut du compte</span>
            <span className="font-semibold text-foreground">{student.isActive ? "Actif" : "Inactif"}</span>
          </div>
          {[
            ["Parcours", student.program],
            ["Niveau", student.level],
            ["Matricule", student.matricule],
            ["Téléphone", student.phone],
          ].map(([label, value]) => value && (
            <div key={label} className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>Fermer</Button>
          <Button className="flex-1 btn" onClick={onDownloadCard}>
            <Download className="size-4" />
            <span>Télécharger la carte</span>
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const notify = (type, message) => {
    setFeedback({ type, message, exiting: false });
    setTimeout(() => {
      setFeedback((f) => (f ? { ...f, exiting: true } : null));
      setTimeout(() => setFeedback(null), 300);
    }, 3500);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesProgram = programFilter === "all" || s.program === programFilter;
      const matchesLevel = levelFilter === "all" || s.level === levelFilter;
      return matchesSearch && matchesStatus && matchesProgram && matchesLevel;
    });
  }, [students, searchQuery, statusFilter, programFilter, levelFilter]);

  const programs = useMemo(
    () => [...new Set(students.map((student) => student.program).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [students]
  );
  const levels = useMemo(
    () => [...new Set(students.map((student) => student.level).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [students]
  );

  useEffect(() => {
    let active = true;
    Promise.all([fetchCourses(), fetchStudentsForTeacher()])
      .then(([courses, studentProfiles]) => Promise.all([
        studentProfiles,
        fetchStudentsForCourses(courses),
      ]))
      .then(([studentProfiles, enrollments]) => {
        if (!active) return;
        const uniqueStudents = new Map(studentProfiles.map((student) => [student.id, {
          ...student,
          name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          course: "Non inscrit à un cours",
          status: student.isActive ? "active" : "pending",
        }]));
        enrollments.forEach((student) => {
          const current = uniqueStudents.get(student.id);
          uniqueStudents.set(student.id, {
            ...student,
            ...(current || {}),
            name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
            course: current && current.course !== "Non inscrit à un cours"
              ? `${current.course}, ${student.course?.name || "Cours"}`
              : student.course?.name || "Cours",
            status: student.isActive ? "active" : "pending",
          });
        });
        setStudents([...uniqueStudents.values()]);
      })
      .catch((error) => notify("error", error.message || "Impossible de charger les étudiants."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  const handleDownloadStudentCard = (student) => {
    const initials = escapeXml(getInitials(student.name) || "ET");
    const name = escapeXml(fitCardText(student.name, 32));
    const matricule = escapeXml(fitCardText(student.matricule, 24));
    const program = escapeXml(fitCardText(student.program, 30));
    const level = escapeXml(fitCardText(student.level, 24));
    const email = escapeXml(fitCardText(student.email, 36));
    const course = escapeXml(fitCardText(student.course, 34));
    const status = student.isActive ? "Compte actif" : "Compte inactif";
    const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b3c5d"/>
          <stop offset="1" stop-color="#126e8a"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#68d5c5"/>
          <stop offset="1" stop-color="#a5f3df"/>
        </linearGradient>
      </defs>
      <rect width="900" height="560" rx="36" fill="#eef5f8"/>
      <rect x="14" y="14" width="872" height="532" rx="30" fill="url(#background)"/>
      <circle cx="825" cy="95" r="150" fill="#ffffff" opacity=".06"/>
      <circle cx="780" cy="48" r="82" fill="#ffffff" opacity=".05"/>
      <path d="M14 410 Q250 350 465 450 T886 410 V516 Q886 546 856 546 H44 Q14 546 14 516Z" fill="#072f49" opacity=".38"/>
      <rect x="58" y="58" width="58" height="58" rx="16" fill="url(#accent)"/>
      <path d="M87 69 105 76v13c0 13-8 22-18 27-10-5-18-14-18-27V76z" fill="#0b3c5d"/>
      <path d="m78 88 6 6 12-13" fill="none" stroke="#a5f3df" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="132" y="83" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="700">EduAI</text>
      <text x="132" y="108" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="13" letter-spacing="2.5">ESPACE ENSEIGNEMENT</text>
      <text x="838" y="86" text-anchor="end" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">CARTE D'ÉTUDIANT</text>
      <line x1="58" y1="144" x2="842" y2="144" stroke="#ffffff" stroke-opacity=".2"/>
      <circle cx="158" cy="277" r="76" fill="#ffffff" opacity=".14"/>
      <circle cx="158" cy="277" r="65" fill="url(#accent)"/>
      <text x="158" y="294" text-anchor="middle" fill="#0b3c5d" font-family="Arial, sans-serif" font-size="43" font-weight="700">${initials}</text>
      <text x="270" y="213" fill="#a5f3df" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">NOM DE L'ÉTUDIANT</text>
      <text x="270" y="253" fill="#ffffff" font-family="Arial, sans-serif" font-size="31" font-weight="700">${name}</text>
      <text x="270" y="299" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">MATRICULE</text>
      <text x="270" y="324" fill="#ffffff" font-family="Arial, sans-serif" font-size="19">${matricule}</text>
      <text x="58" y="390" fill="#a5f3df" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.6">PARCOURS</text>
      <text x="58" y="419" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="600">${program}</text>
      <text x="365" y="390" fill="#a5f3df" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.6">NIVEAU</text>
      <text x="365" y="419" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="600">${level}</text>
      <text x="590" y="390" fill="#a5f3df" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.6">STATUT</text>
      <text x="590" y="419" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="600">${status}</text>
      <text x="58" y="474" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="13">COURS</text>
      <text x="58" y="500" fill="#ffffff" font-family="Arial, sans-serif" font-size="16">${course}</text>
      <text x="842" y="500" text-anchor="end" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="13">${email}</text>
      <text x="842" y="526" text-anchor="end" fill="#a5f3df" font-family="Arial, sans-serif" font-size="11" letter-spacing="1.3">DOCUMENT INFORMATIF • GÉNÉRÉ PAR EDUAI</text>
    </svg>`;

    const blob = new Blob([cardSvg], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    const fileName = `carte-etudiant-${(student.name || "etudiant").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.svg`;
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    notify("success", `Carte d'étudiant téléchargée pour ${student.name}.`);
  };

  const handleAction = (action, student) => {
    if (action === "view") {
      setSelectedStudent(student);
    } else if (action === "contact") {
      navigate("/enseignant/messages", {
        state: {
          selectedStudent: {
            id: student.id,
            name: student.name,
            fullName: student.name,
            email: student.email,
            phone: student.phone,
            role: "STUDENT",
          },
        },
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center text-sm font-medium">
            <span className="status-dot status-dot-active"></span>
            Actif
          </span>
        );
      case "at-risk":
        return (
          <span className="inline-flex items-center text-sm font-medium text-error">
            <span className="status-dot" style={{ background: "var(--error-accent)", boxShadow: "0 0 0 0 rgb(239 68 68 / 0.5)", animation: "eduai-ring-pulse 2s ease-in-out infinite" }}></span>
            En difficulté
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center text-sm font-medium text-warning">
            <span className="status-dot status-dot-pending"></span>
            En attente
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Étudiants"
      subtitle="Résultats, présence et suivi pédagogique de vos étudiants."
    >
      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          className="stat-card" 
          label="Total étudiants" 
          value={String(students.length)} 
          icon={Users} 
          accent="primary" 
        />
        <StatCard 
          className="stat-card" 
          label="Comptes actifs" 
          value={String(students.filter((student) => student.isActive).length)} 
          icon={CheckCircle2} 
          accent="success" 
        />
        <StatCard 
          className="stat-card" 
          label="Cours suivis" 
          value={String(new Set(students.flatMap((student) => student.course?.split(", ") || [])).size)} 
          icon={AlertCircle} 
          accent="primary" 
        />
      </div>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard title="Recherche et filtres">
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher par nom ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche étudiant"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="input-field"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              aria-label="Filtrer par parcours"
            >
              <option value="all">Tous les parcours</option>
              {programs.map((program) => <option key={program} value={program}>{program}</option>)}
            </select>
            <select
              className="input-field"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Filtrer par niveau"
            >
              <option value="all">Tous les niveaux</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tous" },
              { value: "active", label: "Actifs" },
              { value: "pending", label: "En attente" }
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

      {/* === LISTE DES ÉTUDIANTS === */}
      <SectionCard
        title={`${filteredStudents.length} étudiant${filteredStudents.length > 1 ? "s" : ""}`}
      >
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Aucun étudiant trouvé"
            description="Les étudiants apparaîtront après inscription à l'un de vos cours ou modifiez vos filtres."
            action={<Button className="rounded-xl" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setProgramFilter("all"); setLevelFilter("all"); }}>Réinitialiser les filtres</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="audit-table">
              <TableHeader>
                <TableRow className="border-border-strong bg-muted/40">
                  <TableHead className="font-semibold">Étudiant</TableHead>
                  <TableHead className="font-semibold">Cours</TableHead>
                  <TableHead className="font-semibold">Parcours</TableHead>
                  <TableHead className="font-semibold">Niveau</TableHead>
                  <TableHead className="font-semibold">Inscription</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, i) => (
                  <TableRow
                    key={student.id}
                    className="eduai-table-row cursor-pointer"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => handleAction("view", student)}
                  >
                    <TableCell>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {getInitials(student.name)}
                        </div>
                        <div className="user-info">
                          <span className="user-id">{student.name}</span>
                          <span className="user-label">{student.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{student.course}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{student.program || "Non renseigné"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{student.level || "Non renseigné"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">Données académiques non disponibles</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="icon-button-pro size-8" 
                          onClick={() => handleAction("contact", student)}
                          title="Contacter"
                        >
                          <Mail className="size-4" />
                        </button>
                        <button 
                          className="icon-button-pro size-8" 
                          onClick={() => handleAction("view", student)}
                          title="Voir le profil"
                        >
                          <Eye className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* === MODAL DÉTAIL === */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          close={() => setSelectedStudent(null)} 
          onDownloadCard={() => handleDownloadStudentCard(selectedStudent)}
        />
      )}

      {/* === TOAST NOTIFICATIONS === */}
      {feedback && (
        <div
          className={`toast fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg p-4 shadow-xl ${
            feedback.type === "success" ? "toast-success" : feedback.type === "error" ? "toast-error" : "toast-info"
          } ${feedback.exiting ? "toast-exit" : ""}`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5" />
          ) : feedback.type === "error" ? (
            <AlertTriangle className="size-5" />
          ) : (
            <Users className="size-5" />
          )}
          <span className="font-medium text-sm">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 rounded p-1 hover:bg-black/10">
            <X className="size-4" />
          </button>
        </div>
      )}
    </TeacherShell>
  );
}
