import { useState, useMemo, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  Users, 
  TrendingUp, 
  Clock, 
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import apiFetch from "@/utils/api";
import { fetchStudentsForCourses } from "@/utils/academic";

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function CourseCard({ course, index, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const statusConfig = {
    active: { label: "Actif", class: "badge-role-student" },
    draft: { label: "Brouillon", class: "badge-role-teacher" },
    archived: { label: "Archivé", class: "bg-muted text-muted-foreground border border-border" },
  };
  const status = statusConfig[course.status] || statusConfig.draft;

  return (
    <div 
      className="request-card card-surface group p-5 flex flex-col gap-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
            <BookOpen className="size-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground">{course.code}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Actions du cours"
          >
            <MoreVertical className="size-5" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="dropdown-menu absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-xl">
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("view", course); }}>
                  <Eye className="size-4 text-primary" /> Voir les détails
                </button>
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("edit", course); }}>
                  <Pencil className="size-4 text-primary" /> Modifier
                </button>
                <div className="my-1 border-t border-border"></div>
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-soft" onClick={() => { setMenuOpen(false); onAction("delete", course); }}>
                  <Trash2 className="size-4" /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`badge-role ${status.class}`}>
          {status.label}
        </span>
        <span className="action-badge action-badge-default">
          {course.category}
        </span>
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" />
            {course.students} étudiants
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" />
            {course.lastUpdate}
          </span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progression du programme</span>
            <span className="text-primary font-semibold">{course.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateCourseModal({ close, done, course = null }) {
  const [title, setTitle] = useState(course?.title || "");
  const [code, setCode] = useState(course?.code || "");
  const [description, setDescription] = useState(course?.description || "");
  const [targetAcademicClassId, setTargetAcademicClassId] = useState(course?.targetAcademicClassId ? String(course.targetAcademicClassId) : "");
  const [targetClasses, setTargetClasses] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [targetError, setTargetError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch("/academic/teacher/classes")
      .then((response) => {
        if (active) setTargetClasses(response?.data || []);
      })
      .catch((error) => {
        if (active) setTargetError(error.message || "Impossible de charger les classes qui vous sont affectées.");
      })
      .finally(() => {
        if (active) setLoadingTargets(false);
      });

    return () => { active = false; };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await done({ title, code, description, targetAcademicClassId: Number(targetAcademicClassId) });
      setSaving(false);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div className="modal-content card-surface w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h2 className="font-display text-xl font-semibold">{course ? "Modifier le cours" : "Nouveau cours"}</h2>
          <button onClick={close} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Titre du cours</label>
            <Input 
              placeholder="Ex: Mathématiques Avancées" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Code du cours</label>
            <Input 
              placeholder="Ex: MATH-301" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              className="input-field min-h-24 w-full resize-y"
              placeholder="Présentez brièvement ce cours..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="course-target-class">Classe ou groupe ciblé</label>
            <select
              id="course-target-class"
              className="input-field w-full"
              value={targetAcademicClassId}
              onChange={(e) => setTargetAcademicClassId(e.target.value)}
              required
              disabled={loadingTargets || targetClasses.length === 0}
            >
              <option value="">{loadingTargets ? "Chargement des classes..." : "Sélectionner une classe"}</option>
              {targetClasses.map((academicClass) => (
                <option key={academicClass.id} value={academicClass.id}>
                  {academicClass.program.name} · {academicClass.level.name} · {academicClass.name} · {academicClass.academicYear.name}
                </option>
              ))}
            </select>
          </div>
          {targetError && <p className="text-sm text-error" role="alert">{targetError}</p>}
          {!loadingTargets && !targetError && targetClasses.length === 0 && (
            <p className="text-sm text-warning">Aucune classe active ne vous est affectée. Demandez à l'administrateur de vous affecter à une classe.</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Annuler</Button>
            <Button type="submit" className="flex-1 btn" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              <span>{saving ? "Enregistrement..." : course ? "Enregistrer" : "Créer le cours"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourseDetailsModal({ course, close, onEdit }) {
  if (!course) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
      <div className="modal-content card-surface w-full max-w-lg shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="bg-primary-soft p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><BookOpen className="size-6" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{course.code}</p><h2 className="mt-1 font-display text-2xl font-semibold text-foreground">{course.title}</h2></div>
            </div>
            <button type="button" onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-white/60" aria-label="Fermer"><X className="size-5" /></button>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p><p className="mt-2 text-sm leading-6 text-foreground">{course.description || "Aucune description renseignée."}</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">Classe ciblée</p><p className="mt-1 text-sm font-semibold">{course.targetClass ? `${course.targetClass.program.name} · ${course.targetClass.level.name} · ${course.targetClass.name} · ${course.targetClass.academicYear.name}` : "Non renseignée"}</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Étudiants inscrits</p><p className="mt-1 text-xl font-semibold">{course.students}</p></div>
            <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Dernière mise à jour</p><p className="mt-1 text-sm font-semibold">{course.lastUpdate}</p></div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="outline" onClick={close}>Fermer</Button><Button type="button" onClick={onEdit}><Pencil className="size-4" /> Modifier</Button></div>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const notify = (type, message) => {
    setFeedback({ type, message, exiting: false });
    setTimeout(() => {
      setFeedback((f) => (f ? { ...f, exiting: true } : null));
      setTimeout(() => setFeedback(null), 300);
    }, 3500);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, statusFilter]);

  const normalizeCourse = (course) => ({
    id: course.id,
    title: course.name,
    code: course.code,
    description: course.description || "",
    targetAcademicClassId: course.targetAcademicClassId || null,
    targetClass: course.targetClass || null,
    students: course.enrolledStudentCount ?? course.students?.length ?? 0,
    status: "active",
    progress: 0,
    category: course.description ? "Cours" : "Sans description",
    lastUpdate: course.updatedAt
      ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(course.updatedAt))
      : "À l'instant",
  });

  useEffect(() => {
    let active = true;
    apiFetch("/courses")
      .then(async (response) => {
        const loadedCourses = response.data ?? [];
        const enrolledStudents = await fetchStudentsForCourses(loadedCourses);
        const studentsByCourse = enrolledStudents.reduce((counts, student) => {
          const courseId = student.course?.id;
          if (courseId) counts.set(courseId, (counts.get(courseId) || 0) + 1);
          return counts;
        }, new Map());
        if (active) {
          setCourses(loadedCourses.map((course) => normalizeCourse({
            ...course,
            enrolledStudentCount: studentsByCourse.get(course.id) || 0,
          })));
        }
      })
      .catch((error) => { if (active) notify("error", error.message || "Impossible de charger les cours."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleAction = async (action, course) => {
    if (action === "delete") {
      setDeleteTarget(course);
    } else if (action === "view") {
      setSelectedCourse(course);
    } else if (action === "edit") {
      setEditingCourse(course);
      setSelectedCourse(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/courses/${deleteTarget.id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((course) => course.id !== deleteTarget.id));
      notify("success", `Le cours "${deleteTarget.title}" a été supprimé.`);
      setDeleteTarget(null);
    } catch (error) {
      notify("error", error.message || "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCourse = async (newCourse) => {
    try {
      const response = await apiFetch("/courses", {
        method: "POST",
        body: {
          name: newCourse.title,
          code: newCourse.code,
          description: newCourse.description,
          targetAcademicClassId: newCourse.targetAcademicClassId,
        },
      });
      const course = normalizeCourse(response.data);
      setCourses((prev) => [course, ...prev]);
      setShowCreateModal(false);
      notify("success", `Le cours "${course.title}" a été créé avec succès.`);
    } catch (error) {
      notify("error", error.message || "La création du cours a échoué.");
      throw error;
    }
  };

  const handleEditCourse = async (updatedCourse) => {
    try {
      const response = await apiFetch(`/courses/${editingCourse.id}`, {
        method: "PUT",
        body: {
          name: updatedCourse.title,
          code: updatedCourse.code,
          description: updatedCourse.description,
          targetAcademicClassId: updatedCourse.targetAcademicClassId,
        },
      });
      const updated = normalizeCourse(response.data);
      setCourses((prev) => prev.map((course) => course.id === updated.id ? updated : course));
      setEditingCourse(null);
      notify("success", `Le cours "${updated.title}" a été modifié.`);
    } catch (error) {
      notify("error", error.message || "La modification a échoué.");
      throw error;
    }
  };

  // Fermeture des menus au clic extérieur
  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Gestion des cours"
      subtitle="Créez, organisez et suivez la progression de vos cours."
    >
      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          className="stat-card" 
          label="Total des cours" 
          value={String(courses.length)} 
          icon={BookOpen} 
          accent="primary" 
        />
        <StatCard 
          className="stat-card" 
          label="Cours actifs" 
          value={String(courses.filter(c => c.status === "active").length)} 
          icon={TrendingUp} 
          accent="success" 
        />
        <StatCard 
          className="stat-card" 
          label="Étudiants inscrits" 
          value={String(courses.reduce((acc, c) => acc + c.students, 0))} 
          icon={Users} 
          accent="primary" 
        />
        <StatCard 
          className="stat-card" 
          label="Cours mis à jour" 
          value={String(courses.filter((course) => course.lastUpdate !== "À l'instant").length)} 
          icon={Clock} 
          accent="warning" 
        />
      </div>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard title="Recherche et filtres">
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher par titre ou code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche de cours"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tous" },
              { value: "active", label: "Actifs" },
              { value: "draft", label: "Brouillons" },
              { value: "archived", label: "Archivés" }
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
        actions={
          <Button className="btn" onClick={() => { setEditingCourse(null); setShowCreateModal(true); }}>
            <Plus className="size-4" />
            Nouveau cours
          </Button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state py-12 text-center">
            <div className="empty-state-icon mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary-soft">
              <BookOpen className="size-8 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">
              {searchQuery || statusFilter !== "all" ? "Aucun résultat" : "Aucun cours pour l'instant"}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" 
                ? "Essayez avec d'autres termes de recherche ou modifiez vos filtres." 
                : "Créez votre premier cours pour commencer à déposer des documents."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button className="btn" onClick={() => { setEditingCourse(null); setShowCreateModal(true); }}>
                <Plus className="size-4" />
                Créer un cours
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                index={index} 
                onAction={handleAction} 
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* === MODALS === */}
      {showCreateModal && (
        <CreateCourseModal 
          close={() => setShowCreateModal(false)}
          done={handleCreateCourse}
        />
      )}

      {editingCourse && (
        <CreateCourseModal
          course={editingCourse}
          close={() => setEditingCourse(null)}
          done={handleEditCourse}
        />
      )}

      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          close={() => setSelectedCourse(null)}
          onEdit={() => { setEditingCourse(selectedCourse); setSelectedCourse(null); }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce cours ?"
        description="Cette action est définitive et ne peut pas être annulée."
        itemName={deleteTarget?.title}
        detail={deleteTarget?.code}
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* === TOAST NOTIFICATIONS === */}
      {feedback && (
        <div
          className={`toast fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg p-4 ${
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
            <BookOpen className="size-5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}
    </TeacherShell>
  );
}
