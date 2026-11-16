import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ListChecks, 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  Send, 
  Copy, 
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  FileSpreadsheet,
  Download,
  Loader2
} from "lucide-react";

import TeacherShell, { teacherNav } from "./teacherNav";
import { SectionCard, StatCard, EmptyState } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import apiFetch from "@/utils/api";
import { formatDate } from "@/utils/academic";

/* =========================================================
   COMPOSANTS INTERNES
   ========================================================= */

function ExamCard({ exam, index, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const statusConfig = {
    draft: { 
      label: "Brouillon", 
      class: "badge-role-teacher",
      icon: Pencil,
      color: "text-primary"
    },
    published: { 
      label: "Publié", 
      class: "badge-role-student",
      icon: Send,
      color: "text-success"
    },
    active: { 
      label: "En cours", 
      class: "bg-warning-soft text-warning border border-warning/20",
      icon: Clock,
      color: "text-warning"
    },
    completed: { 
      label: "Terminé", 
      class: "bg-muted text-muted-foreground border border-border",
      icon: CheckCircle2,
      color: "text-muted-foreground"
    },
  };
  const status = statusConfig[exam.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  return (
    <div 
      className="request-card card-surface group p-5 flex flex-col gap-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft transition-transform duration-300 group-hover:scale-110 ${status.color}`}>
            <ListChecks className="size-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-foreground truncate" title={exam.title}>
              {exam.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="size-3" />
              {exam.date}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Actions de l'examen"
          >
            <MoreVertical className="size-4" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="dropdown-menu absolute right-0 z-50 mt-1 w-52 rounded-lg border border-border bg-card py-1 shadow-xl">
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("view", exam); }}>
                  <Eye className="size-4 text-primary" /> Voir les résultats
                </button>
                {exam.status === "draft" && (
                  <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("publish", exam); }}>
                    <Send className="size-4 text-primary" /> Publier
                  </button>
                )}
                {exam.status !== "completed" && (
                  <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("edit", exam); }}>
                    <Pencil className="size-4 text-primary" /> Modifier
                  </button>
                )}
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); onAction("duplicate", exam); }}>
                  <Copy className="size-4 text-primary" /> Dupliquer
                </button>
                <div className="my-1 border-t border-border"></div>
                <button className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-soft" onClick={() => { setMenuOpen(false); onAction("delete", exam); }}>
                  <Trash2 className="size-4" /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.class}`}>
          <StatusIcon className="size-3" />
          {status.label}
        </span>
        <span className="action-badge action-badge-default text-xs">
          <FileText className="size-3" />
          {exam.expectedQuestionCount
            ? `${exam.questions} / ${exam.expectedQuestionCount} questions`
            : `${exam.questions} questions`}
        </span>
        <span className="action-badge action-badge-default text-xs">
          <Clock className="size-3" />
          {exam.duration} min
        </span>
      </div>

      <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" />
            {exam.eligibleParticipants} étudiants éligibles
          </span>
          {exam.status === "completed" && (
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <TrendingUp className="size-4" />
              Moy: {exam.average}/20
            </span>
          )}
        </div>
        
        {exam.status === "completed" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Taux de réussite</span>
              <span className="text-primary font-semibold">{exam.successRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${exam.successRate}%` }}
              />
            </div>
          </div>
        )}

        {exam.status === "active" && (
          <div className="flex items-center gap-2 text-xs text-warning">
            <Clock className="size-3 animate-pulse" />
            <span>Temps restant: {exam.timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutesToDateTimeLocal(value, minutes) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime()) || !Number.isFinite(minutes)) return "";
  date.setMinutes(date.getMinutes() + minutes);
  return toDateTimeLocal(date);
}

function getDefaultStartDate() {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 15);
  return toDateTimeLocal(date);
}

function getMinimumStartDate() {
  const date = new Date();
  const hasRemainingSeconds = date.getSeconds() > 0 || date.getMilliseconds() > 0;
  date.setSeconds(0, 0);
  if (hasRemainingSeconds) date.setMinutes(date.getMinutes() + 1);
  return toDateTimeLocal(date);
}

function toISOStringOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function CreateExamModal({ close, done, courses, initialExam = null }) {
  const [title, setTitle] = useState(initialExam?.title || "");
  const [description, setDescription] = useState(initialExam?.description || "");
  const [course, setCourse] = useState(initialExam?.courseId ? String(initialExam?.courseId) : "");
  const [targetAcademicClassId, setTargetAcademicClassId] = useState(initialExam?.targetAcademicClassId ? String(initialExam.targetAcademicClassId) : "");
  const [duration, setDuration] = useState(String(initialExam?.duration || 60));
  const defaultStartDate = getDefaultStartDate();
  const initialStartDate = toDateTimeLocal(initialExam?.startDate) || defaultStartDate;
  const [questions, setQuestions] = useState(String(
    initialExam
      ? initialExam.expectedQuestionCount ?? Math.max(initialExam.questions || 0, 1)
      : 10
  ));
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(
    toDateTimeLocal(initialExam?.endDate)
      || addMinutesToDateTimeLocal(initialStartDate, Number(initialExam?.duration || 60))
  );
  const [targetClasses, setTargetClasses] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [targetError, setTargetError] = useState("");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const minimumStartDate = getMinimumStartDate();
  const minimumEndDate = addMinutesToDateTimeLocal(startDate, Number(duration));

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

  const eligibleCourses = useMemo(
    () => courses.filter((item) => String(item.targetAcademicClassId) === String(targetAcademicClassId)),
    [courses, targetAcademicClassId]
  );

  async function submit(e) {
    e.preventDefault();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (!start || Number.isNaN(start.getTime())) {
      setValidationError("Renseignez une date de début valide.");
      return;
    }
    if (start < new Date()) {
      setValidationError("La date de début ne peut pas être dans le passé.");
      return;
    }
    if (!end || Number.isNaN(end.getTime()) || end <= start) {
      setValidationError("Renseignez une date de fin postérieure au début.");
      return;
    }
    if (!Number.isInteger(Number(duration)) || Number(duration) < 10 || Number(duration) > 180) {
      setValidationError("La durée doit être comprise entre 10 et 180 minutes.");
      return;
    }
    if (end - start < Number(duration) * 60 * 1000) {
      setValidationError("La période entre le début et la fin doit couvrir toute la durée de l'examen.");
      return;
    }
    if (!Number.isInteger(Number(questions)) || Number(questions) < 1 || Number(questions) > 50) {
      setValidationError("Le nombre de questions doit être compris entre 1 et 50.");
      return;
    }
    if (!targetAcademicClassId || !eligibleCourses.some((item) => String(item.id) === String(course))) {
      setValidationError("Choisissez une classe affectée et un cours destiné à cette même classe.");
      return;
    }
    setValidationError("");
    setSaving(true);
    try {
      await done({ title, description, course, targetAcademicClassId: Number(targetAcademicClassId), expectedQuestionCount: Number(questions), duration: Number(duration), startDate: toISOStringOrNull(startDate), endDate: toISOStringOrNull(endDate) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div className="modal-content card-surface w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h2 className="font-display text-xl font-semibold">{initialExam ? "Modifier l'examen" : "Nouvel examen"}</h2>
          <button onClick={close} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {validationError && <p className="rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{validationError}</p>}
          <div>
            <label className="mb-2 block text-sm font-medium">Titre de l'examen</label>
            <Input 
              placeholder="Ex: Examen final - Mathématiques" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="exam-target-class">Classe ou groupe ciblé</label>
            <select
              id="exam-target-class"
              className="input-field w-full"
              value={targetAcademicClassId}
              onChange={(event) => {
                const value = event.target.value;
                setTargetAcademicClassId(value);
                if (!courses.some((item) => String(item.id) === String(course) && String(item.targetAcademicClassId) === value)) setCourse("");
              }}
              required
              disabled={loadingTargets || targetClasses.length === 0}
            >
              <option value="">{loadingTargets ? "Chargement des classes..." : "Sélectionner une classe"}</option>
              {targetClasses.map((item) => <option key={item.id} value={item.id}>{item.program.name} · {item.level.name} · {item.name} · {item.academicYear.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="exam-course">Cours associé</label>
            <select
              id="exam-course"
              className="input-field"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              required
              disabled={!targetAcademicClassId || eligibleCourses.length === 0}
            >
              <option value="">{eligibleCourses.length ? "Sélectionner un cours" : "Aucun cours pour cette classe"}</option>
              {eligibleCourses.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea className="input-field min-h-20 w-full resize-y" placeholder="Objectifs et consignes de l'examen..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre prévu de questions</label>
              <Input 
                type="number"
                min="1"
                max="50"
                step="1"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">Vous ajouterez le contenu des questions après la création.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Durée (minutes)</label>
              <Input 
                type="number"
                min="10"
                max="180"
                step="1"
                value={duration}
                onChange={(e) => {
                  const value = e.target.value;
                  setDuration(value);
                  const minimumEnd = addMinutesToDateTimeLocal(startDate, Number(value));
                  if (value && endDate && endDate < minimumEnd) setEndDate(minimumEnd);
                }}
                required
              />
            </div>
          </div>
          {targetError && <p className="text-sm text-error" role="alert">{targetError}</p>}
          {!loadingTargets && !targetError && targetClasses.length === 0 && <p className="text-sm text-warning">Aucune classe active ne vous est affectée. Demandez à l'administrateur de vous affecter à une classe.</p>}
          {!loadingTargets && targetAcademicClassId && eligibleCourses.length === 0 && <p className="text-sm text-warning">Aucun cours ne cible cette classe. Créez d'abord un cours pour ce groupe.</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="exam-start-date">Début</label>
              <Input
                type="datetime-local"
                id="exam-start-date"
                min={minimumStartDate}
                value={startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setStartDate(value);
                  const minimumEnd = addMinutesToDateTimeLocal(value, Number(duration));
                  if (value && endDate && endDate < minimumEnd) setEndDate(minimumEnd);
                }}
                className="cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="exam-end-date">Fin</label>
              <Input
                type="datetime-local"
                id="exam-end-date"
                min={minimumEndDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="cursor-pointer"
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">La période entre le début et la fin doit couvrir toute la durée accordée à chaque étudiant.</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Annuler</Button>
            <Button type="submit" className="flex-1 btn" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              <span>{saving ? "Enregistrement..." : initialExam ? "Enregistrer" : "Créer l'examen"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionModal({ exam, close, done }) {
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState("MCQ");
  const [options, setOptions] = useState("");
  const [points, setPoints] = useState("1");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await done({
        questionText,
        type,
        options: type === "MCQ" ? options.split("\n").map((option) => option.trim()).filter(Boolean) : null,
        points: Number(points),
      });
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
      <div className="modal-content card-surface w-full max-w-lg p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4"><div><h2 className="font-display text-xl font-semibold">Nouvelle question</h2><p className="mt-1 text-xs text-muted-foreground">{exam.title}</p></div><button type="button" onClick={close} aria-label="Fermer" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="mb-2 block text-sm font-medium">Énoncé</label><textarea className="input-field min-h-24 w-full resize-y" value={questionText} onChange={(event) => setQuestionText(event.target.value)} required /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium">Type</label><select className="input-field w-full" value={type} onChange={(event) => setType(event.target.value)}><option value="MCQ">QCM</option><option value="OPEN">Question ouverte</option></select></div><div><label className="mb-2 block text-sm font-medium">Points</label><Input type="number" min="0.5" step="0.5" value={points} onChange={(event) => setPoints(event.target.value)} required /></div></div>
          {type === "MCQ" && <div><label className="mb-2 block text-sm font-medium">Options, une par ligne</label><textarea className="input-field min-h-24 w-full resize-y" value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Option A\nOption B\nOption C" required /></div>}
          <p className="text-xs text-muted-foreground">Les réponses seront corrigées manuellement après la soumission des copies.</p>
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={close}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Enregistrement..." : "Ajouter la question"}</Button></div>
        </form>
      </div>
    </div>
  );
}

function ExamDetailModal({ exam, close, addQuestion, publish, deleteQuestion, exportResults }) {
  const [showResultsTable, setShowResultsTable] = useState(false);
  const [exportingFormat, setExportingFormat] = useState("");
  if (!exam) return null;

  async function handleExport(format) {
    setExportingFormat(format);
    try {
      await exportResults(exam.id, format);
    } finally {
      setExportingFormat("");
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div className="modal-content card-surface w-full max-w-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{exam.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{exam.course} • {exam.date}</p>
          </div>
          <button onClick={close} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Questions</p>
            <p className="text-2xl font-bold text-foreground">
              {exam.expectedQuestionCount ? `${exam.questions} / ${exam.expectedQuestionCount}` : exam.questions}
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Durée</p>
            <p className="text-2xl font-bold text-foreground">{exam.duration || "N/D"} min</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Étudiants éligibles</p>
            <p className="text-2xl font-bold text-foreground">{exam.eligibleParticipants}</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Résultats</p>
            <p className="text-2xl font-bold text-primary">N/D</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Données disponibles</h3>
          <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Classe ciblée</p><p className="mt-1 text-sm font-semibold">{exam.targetClass ? `${exam.targetClass.program.name} · ${exam.targetClass.level.name} · ${exam.targetClass.name} · ${exam.targetClass.academicYear.name}` : [exam.targetProgram, exam.targetLevel].filter(Boolean).join(" · ") || "Non définie"}</p></div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Période de l'examen</p>
            <p className="mt-1 text-sm font-semibold">
              Début : {exam.startDate ? new Date(exam.startDate).toLocaleString("fr-FR") : "Non défini"}
              {" · "}
              Fin : {exam.endDate ? new Date(exam.endDate).toLocaleString("fr-FR") : "Non définie"}
            </p>
          </div>
          {exam.questionDetails?.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-sm text-foreground">Questions associées</h3>{exam.questionDetails.map((question, index) => <div key={question.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"><span>{index + 1}. {question.question} <span className="text-xs text-muted-foreground">({question.type}, {question.points} pt)</span></span>{exam.status === "draft" && <button type="button" className="text-error" onClick={() => deleteQuestion(question.id)} aria-label="Supprimer la question"><Trash2 className="size-4" /></button>}</div>)}</div>}
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Résultats des étudiants</h3>
                <p className="mt-1 text-xs text-muted-foreground">{exam.results?.length || 0} résultat(s) enregistré(s)</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowResultsTable((visible) => !visible)}>
                <Users className="size-4" />
                {showResultsTable ? "Masquer le tableau" : "Afficher le tableau"}
              </Button>
            </div>
            {showResultsTable && (
              <div className="mt-4 space-y-3">
                {exam.results?.length ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" disabled={Boolean(exportingFormat)} onClick={() => handleExport("pdf")}>
                        {exportingFormat === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        Exporter en PDF
                      </Button>
                      <Button type="button" variant="outline" disabled={Boolean(exportingFormat)} onClick={() => handleExport("xlsx")}>
                        {exportingFormat === "xlsx" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                        Exporter en Excel
                      </Button>
                    </div>
                    <div className="max-h-80 overflow-auto rounded-lg border border-border">
                      <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-3 font-semibold">Matière</th>
                            <th className="px-3 py-3 font-semibold">Matricule</th>
                            <th className="px-3 py-3 font-semibold">Nom</th>
                            <th className="px-3 py-3 font-semibold">Prénom</th>
                            <th className="px-3 py-3 font-semibold">Note</th>
                            <th className="px-3 py-3 font-semibold">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.results.map((result) => (
                            <tr key={result.id} className="border-t border-border">
                              <td className="px-3 py-3">{exam.resultSubject || exam.course}</td>
                              <td className="px-3 py-3">{result.student?.matricule || "—"}</td>
                              <td className="px-3 py-3">{result.student?.lastName || "—"}</td>
                              <td className="px-3 py-3">{result.student?.firstName || "—"}</td>
                              <td className="px-3 py-3 font-semibold">
                                {result.status === "ABSENT" ? `0/${result.totalPoints}` : `${result.score}/${result.totalPoints}`}
                              </td>
                              <td className={`px-3 py-3 font-medium ${result.status === "ABSENT" ? "text-error" : "text-success"}`}>
                                {result.status === "ABSENT" ? "Absent" : "Présent"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Aucun résultat enregistré pour cet examen.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>Fermer</Button>
          {exam.status === "draft" && (!exam.expectedQuestionCount || exam.questions < exam.expectedQuestionCount) && <Button type="button" className="flex-1" onClick={addQuestion}><Plus className="size-4" />Ajouter une question</Button>}
          {exam.status === "draft" && <Button type="button" className="flex-1" disabled={!exam.questions || (exam.expectedQuestionCount && exam.questions !== exam.expectedQuestionCount)} onClick={publish}><Send className="size-4" />Publier</Button>}
          {exam.status !== "draft" && <Button asChild className="flex-1"><Link to={`/enseignant/examens/${exam.id}/correction`}><CheckCircle2 className="size-4" />Corriger les copies</Link></Button>}
        </div>
        {exam.status === "draft" && exam.expectedQuestionCount && exam.questions < exam.expectedQuestionCount && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Ajoutez encore {exam.expectedQuestionCount - exam.questions} question(s) avant de publier.
          </p>
        )}
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
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);

  const notify = (type, message) => {
    setFeedback({ type, message, exiting: false });
    setTimeout(() => {
      setFeedback((f) => (f ? { ...f, exiting: true } : null));
      setTimeout(() => setFeedback(null), 300);
    }, 3500);
  };

  const normalizeExam = (exam) => ({
    id: exam.id,
    title: exam.title,
    courseId: exam.courseId,
    description: exam.description || "",
    targetProgram: exam.targetProgram || "",
    targetLevel: exam.targetLevel || "",
    targetAcademicClassId: exam.targetAcademicClassId || null,
    targetClass: exam.targetClass || null,
    startDate: exam.startDate,
    endDate: exam.endDate,
    course: exam.course?.code || "Cours",
    date: formatDate(exam.startDate),
    questions: exam.questions?.length ?? 0,
    expectedQuestionCount: exam.expectedQuestionCount ?? null,
    participants: exam.attempts?.length ?? 0,
    eligibleParticipants: exam.eligibleStudentCount ?? exam.eligibleParticipants ?? 0,
    status: exam.status === "PUBLISHED" ? "published" : exam.status === "CLOSED" ? "completed" : "draft",
    duration: exam.duration,
  });

  useEffect(() => {
    Promise.all([apiFetch("/exams"), apiFetch("/courses")])
      .then(async ([examResponse, courseResponse]) => {
        const details = await Promise.all((examResponse.data ?? []).map((exam) => apiFetch(`/exams/${exam.id}`).then((response) => response.data).catch(() => exam)));
        const loadedCourses = courseResponse.data ?? [];
        const sourceExams = new Map((examResponse.data ?? []).map((exam) => [exam.id, exam]));
        const normalizedExams = details.map((exam) => normalizeExam({
          ...exam,
          eligibleStudentCount: exam.eligibleStudentCount
            ?? sourceExams.get(exam.id)?.eligibleStudentCount
            ?? 0,
        }));
        setExams(normalizedExams);
        setCourses(loadedCourses);
      })
      .catch((error) => notify("error", error.message || "Impossible de charger les examens."));
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            e.course.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exams, searchQuery, statusFilter]);

  const handleAction = async (action, exam) => {
    if (action === "delete") {
      setDeleteTarget(exam);
    } else if (action === "publish") {
      try {
        const response = await apiFetch(`/exams/${exam.id}/publish`, { method: "PATCH" });
        setExams((prev) => prev.map((item) => item.id === exam.id
          ? normalizeExam({ ...response.data, eligibleParticipants: exam.eligibleParticipants })
          : item));
        notify("success", `L'examen "${exam.title}" a été publié.`);
      } catch (error) { notify("error", error.message || "La publication a échoué."); }
    } else if (action === "duplicate") {
      try {
        const response = await apiFetch("/exams", { method: "POST", body: { title: `${exam.title} (copie)`, description: exam.description, courseId: exam.courseId, expectedQuestionCount: exam.expectedQuestionCount ?? Math.max(exam.questions, 1), duration: exam.duration, startDate: exam.startDate, endDate: exam.endDate, targetAcademicClassId: exam.targetAcademicClassId } });
        setExams((prev) => [normalizeExam(response.data), ...prev]);
        notify("success", "L'examen a été dupliqué.");
      } catch (error) { notify("error", error.message || "La duplication a échoué."); }
    } else if (action === "view") {
      try {
        const [detailResponse, resultsResponse] = await Promise.all([
          apiFetch(`/exams/${exam.id}`),
          apiFetch(`/exams/${exam.id}/results`),
        ]);
        const questionDetails = detailResponse.data?.questions ?? [];
        setSelectedExam({
          ...exam,
          questions: questionDetails.length,
          questionDetails,
          resultSubject: resultsResponse.exam?.course?.name || resultsResponse.exam?.course?.code || exam.course,
          results: resultsResponse.data ?? [],
        });
      } catch (error) { notify("error", error.message || "Impossible de charger les résultats."); }
    } else if (action === "edit") {
      setEditingExam(exam);
    }
  };

  const confirmDeleteExam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/exams/${deleteTarget.id}`, { method: "DELETE" });
      setExams((previous) => previous.filter((exam) => exam.id !== deleteTarget.id));
      notify("success", `L'examen "${deleteTarget.title}" a été supprimé.`);
      setDeleteTarget(null);
    } catch (error) {
      notify("error", error.message || "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportResults = async (examId, format) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("educai_access_token");
      const response = await fetch(`${apiUrl}/exams/${examId}/results/export/${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "L'export des résultats a échoué.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `resultats-examen-${examId}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      notify("error", error.message || "L'export des résultats a échoué.");
    }
  };

  const handleAddQuestion = async (question) => {
    try {
      const response = await apiFetch(`/exam-questions/exam/${selectedExam.id}`, {
        method: "POST",
        body: question,
      });
      const addedQuestion = response.data;
      const updated = { ...selectedExam, questions: selectedExam.questions + 1 };
      setSelectedExam(updated);
      setExams((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      notify("success", "Question ajoutée.");
      return addedQuestion;
    } catch (error) {
      notify("error", error.message || "Impossible d'ajouter la question.");
      throw error;
    }
  };

  const handleDeleteQuestion = (questionId) => {
    const question = selectedExam?.questionDetails.find((item) => item.id === questionId);
    if (question) setDeleteQuestionTarget(question);
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestionTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/exam-questions/${deleteQuestionTarget.id}`, { method: "DELETE" });
      setSelectedExam((current) => current ? { ...current, questions: current.questions - 1, questionDetails: current.questionDetails.filter((question) => question.id !== deleteQuestionTarget.id) } : current);
      setExams((previous) => previous.map((item) => item.id === selectedExam?.id ? { ...item, questions: item.questions - 1 } : item));
      notify("success", "Question supprimée.");
      setDeleteQuestionTarget(null);
    } catch (error) {
      notify("error", error.message || "Impossible de supprimer la question.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateExam = async (updatedExam) => {
    try {
      const response = await apiFetch(`/exams/${updatedExam.id}`, {
        method: "PUT",
        body: { title: updatedExam.title, description: updatedExam.description, courseId: Number(updatedExam.course), expectedQuestionCount: updatedExam.expectedQuestionCount, duration: Number(updatedExam.duration), startDate: updatedExam.startDate, endDate: updatedExam.endDate, targetAcademicClassId: updatedExam.targetAcademicClassId },
      });
      const normalized = normalizeExam({ ...response.data, eligibleStudentCount: editingExam.eligibleParticipants });
      setExams((previous) => previous.map((item) => item.id === normalized.id ? normalized : item));
      setEditingExam(null);
      notify("success", "Examen modifié.");
    } catch (error) { notify("error", error.message || "La modification a échoué."); }
  };

  const publishExam = async () => {
    if (!selectedExam || selectedExam.questions < 1) return;
    await handleAction("publish", selectedExam);
    setSelectedExam(null);
  };

  const handleCreateExam = async (newExam) => {
    const response = await apiFetch("/exams", {
      method: "POST",
      body: { title: newExam.title, description: newExam.description, courseId: Number(newExam.course), expectedQuestionCount: newExam.expectedQuestionCount, duration: newExam.duration, startDate: newExam.startDate, endDate: newExam.endDate, targetAcademicClassId: newExam.targetAcademicClassId },
    });
    const exam = normalizeExam(response.data);
    setExams((prev) => [exam, ...prev]);
    setShowCreateModal(false);
    notify("success", `L'examen "${newExam.title}" a été créé.`);
  };

  return (
    <TeacherShell
      nav={teacherNav}
      role="enseignant"
      title="Examens"
      subtitle="Créez, publiez et suivez vos évaluations."
    >
      {/* === STAT CARDS === */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          className="stat-card" 
          label="Total examens" 
          value={String(exams.length)} 
          icon={ListChecks} 
          accent="primary" 
        />
        <StatCard 
          className="stat-card" 
          label="Examens actifs" 
          value={String(exams.filter(e => e.status === "active" || e.status === "published").length)} 
          icon={Send} 
          accent="success" 
        />
        <StatCard 
          className="stat-card" 
          label="À corriger" 
          value={String(exams.filter(e => e.status === "completed").length)} 
          icon={Clock} 
          accent="warning" 
        />
        <StatCard className="stat-card" label="Résultats disponibles" value="N/D" hint="Les tentatives ne sont pas encore exposées" icon={TrendingUp} accent="primary" />
      </div>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard 
        title="Vos examens"
        actions={
          <Button className="btn" onClick={() => setShowCreateModal(true)}>
            <Plus className="size-4" />
            Nouvel examen
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Rechercher un examen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Tous" },
                { value: "draft", label: "Brouillons" },
                { value: "published", label: "Publiés" },
                { value: "active", label: "En cours" },
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

          {/* === LISTE DES EXAMENS === */}
          {filteredExams.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Aucun examen trouvé"
              description={searchQuery || statusFilter !== "all" 
                ? "Essayez de modifier vos critères de recherche ou vos filtres." 
                : "Créez votre premier examen pour commencer à évaluer vos étudiants."}
              action={!searchQuery && statusFilter === "all" ? (
                <Button className="rounded-xl" onClick={() => setShowCreateModal(true)}>
                  <Plus className="size-4" />
                  Nouvel examen
                </Button>
              ) : null}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam, index) => (
                <ExamCard 
                  key={exam.id} 
                  exam={exam} 
                  index={index} 
                  onAction={handleAction} 
                />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* === MODALS === */}
      {showCreateModal && (
        <CreateExamModal 
          close={() => setShowCreateModal(false)} 
          done={handleCreateExam} 
          courses={courses}
        />
      )}

      {editingExam && <CreateExamModal close={() => setEditingExam(null)} done={(values) => handleUpdateExam({ ...values, id: editingExam.id })} courses={courses} initialExam={editingExam} />}

      {selectedExam && (
        <ExamDetailModal 
          exam={selectedExam} 
          close={() => setSelectedExam(null)} 
          addQuestion={() => setShowQuestionModal(true)}
          publish={publishExam}
          deleteQuestion={handleDeleteQuestion}
          exportResults={handleExportResults}
        />
      )}

      {showQuestionModal && selectedExam && (
        <QuestionModal
          exam={selectedExam}
          close={() => setShowQuestionModal(false)}
          done={handleAddQuestion}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer cet examen ?"
        description="Cette action supprimera également les données associées et ne peut pas être annulée."
        itemName={deleteTarget?.title}
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteExam}
      />

      <ConfirmDialog
        open={Boolean(deleteQuestionTarget)}
        title="Supprimer cette question ?"
        description="Cette action est définitive et ne peut pas être annulée."
        itemName={deleteQuestionTarget?.question}
        isBusy={deleting}
        onCancel={() => setDeleteQuestionTarget(null)}
        onConfirm={confirmDeleteQuestion}
      />

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
            <ListChecks className="size-5" />
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