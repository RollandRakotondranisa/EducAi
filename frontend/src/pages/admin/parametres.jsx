import { useEffect, useState } from "react";
import { AlertTriangle, Check, GraduationCap, Loader2, Plus, School, Settings, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useTheme } from "@/components/theme/ThemeProvider";
import apiFetch from "@/utils/api";

const themeOptions = [
  { value: "light", title: "Mode clair", description: "Une interface lumineuse pour la journée." },
  { value: "dark", title: "Mode sombre", description: "Une interface plus douce dans les environnements peu éclairés." },
];

const emptyStructure = { years: [], programs: [], levels: [], classes: [], teachers: [] };

function AcademicClassCard({ academicClass, teachers, run, onDelete, busy }) {
  const [teacherIds, setTeacherIds] = useState(academicClass.teachers.map((teacher) => String(teacher.id)));

  useEffect(() => {
    setTeacherIds(academicClass.teachers.map((teacher) => String(teacher.id)));
  }, [academicClass.teachers]);

  async function saveTeachers(event) {
    event.preventDefault();
    await run(`/academic/admin/classes/${academicClass.id}/teachers`, {
      method: "PUT",
      body: { teacherIds: teacherIds.map(Number) },
    }, "Affectations des enseignants enregistrées.");
  }

  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{academicClass.program.name} · {academicClass.level.name} · {academicClass.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{academicClass.academicYear.name}</p>
        </div>
        <Button type="button" variant="outline" disabled={busy} onClick={() => onDelete(`/academic/admin/classes/${academicClass.id}`, "Classe supprimée.", `${academicClass.program.name} · ${academicClass.level.name} · ${academicClass.name}`)}>
          <Trash2 className="size-4" /> Supprimer
        </Button>
      </div>
      <form onSubmit={saveTeachers} className="mt-4 space-y-3">
        <Label htmlFor={`teachers-${academicClass.id}`}>Enseignants affectés</Label>
        <select
          id={`teachers-${academicClass.id}`}
          multiple
          value={teacherIds}
          onChange={(event) => setTeacherIds(Array.from(event.target.selectedOptions, (option) => option.value))}
          className="input-field min-h-28"
        >
          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName} · {teacher.email}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs enseignants.</p>
        <div className="flex justify-end"><Button type="submit">Enregistrer les affectations</Button></div>
      </form>
    </article>
  );
}

export default function ParametresPage() {
  const { theme, setTheme } = useTheme();
  const [structure, setStructure] = useState(emptyStructure);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [year, setYear] = useState({ name: "", startsAt: "", endsAt: "" });
  const [programName, setProgramName] = useState("");
  const [level, setLevel] = useState({ name: "", position: "0" });
  const [academicClass, setAcademicClass] = useState({ name: "", academicYearId: "", programId: "", levelId: "", teacherIds: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadStructure() {
    const response = await apiFetch("/academic/admin");
    setStructure(response?.data || emptyStructure);
  }

  useEffect(() => {
    loadStructure()
      .catch((loadError) => setError(loadError.message || "Impossible de charger la structure académique."))
      .finally(() => setLoading(false));
  }, []);

  async function run(path, options, message) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(path, options);
      await loadStructure();
      setSuccess(message);
      return true;
    } catch (requestError) {
      setError(requestError.message || "L'opération n'a pas pu être effectuée.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createYear(event) {
    event.preventDefault();
    if (await run("/academic/admin/years", { method: "POST", body: year }, "Année universitaire créée.")) {
      setYear({ name: "", startsAt: "", endsAt: "" });
    }
  }

  async function createProgram(event) {
    event.preventDefault();
    if (await run("/academic/admin/programs", { method: "POST", body: { name: programName } }, "Parcours créé.")) setProgramName("");
  }

  async function createLevel(event) {
    event.preventDefault();
    if (await run("/academic/admin/levels", { method: "POST", body: level }, "Niveau créé.")) setLevel({ name: "", position: "0" });
  }

  async function createClass(event) {
    event.preventDefault();
    if (await run("/academic/admin/classes", { method: "POST", body: { ...academicClass, teacherIds: academicClass.teacherIds.map(Number) } }, "Classe créée et enseignants affectés.")) {
      setAcademicClass({ name: "", academicYearId: "", programId: "", levelId: "", teacherIds: [] });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (await run(deleteTarget.path, { method: "DELETE" }, deleteTarget.successMessage)) {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard className="section-card-pro">
        <div className="section-header">
          <div className="section-header-icon"><Settings className="size-5" /></div>
          <div className="section-header-title"><h3>Apparence</h3><p>Choisissez le thème de votre interface.</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {themeOptions.map(({ value, title, description }) => {
            const selected = theme === value;
            return <button key={value} type="button" onClick={() => setTheme(value)} aria-pressed={selected} className={`theme-option ${selected ? "active" : ""}`}>
              <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span>
              {selected && <Check className="size-5 text-primary" aria-label="Sélectionné" />}
            </button>;
          })}
        </div>
      </SectionCard>

      <SectionCard title="Structure académique" description="Configurez les années universitaires, les parcours, les niveaux, les classes et les enseignants qui y interviennent.">
        {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error-soft p-4 text-sm text-error" role="alert"><AlertTriangle className="size-4 shrink-0" />{error}</div>}
        {success && <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft p-4 text-sm text-success" role="status"><Check className="size-4 shrink-0" />{success}</div>}
        {loading ? <div className="flex min-h-28 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" />Chargement de la structure...</div> : (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2"><School className="size-5 text-primary" /><h4 className="font-semibold">Années universitaires</h4></div>
              <form onSubmit={createYear} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-4">
                <div className="space-y-2"><Label htmlFor="academic-year-name">Année (AAAA-AAAA)</Label><Input id="academic-year-name" value={year.name} onChange={(event) => setYear({ ...year, name: event.target.value })} placeholder="2026-2027" pattern="\d{4}-\d{4}" required /></div>
                <div className="space-y-2"><Label htmlFor="academic-year-start">Date de début</Label><Input id="academic-year-start" type="date" value={year.startsAt} onChange={(event) => setYear({ ...year, startsAt: event.target.value })} required /></div>
                <div className="space-y-2"><Label htmlFor="academic-year-end">Date de fin</Label><Input id="academic-year-end" type="date" value={year.endsAt} onChange={(event) => setYear({ ...year, endsAt: event.target.value })} required /></div>
                <div className="flex items-end"><Button type="submit" disabled={busy}><Plus className="size-4" />Créer</Button></div>
              </form>
              <div className="space-y-2">{structure.years.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div><span className="font-medium">{item.name}</span><span className="ml-2 text-sm text-muted-foreground">{item.startsAt} – {item.endsAt}</span>{item.isActive && <span className="ml-2 rounded-full bg-success-soft px-2 py-1 text-xs font-medium text-success">Année active</span>}</div>
                <div className="flex gap-2">
                  {!item.isActive && <Button type="button" variant="outline" disabled={busy} onClick={() => run(`/academic/admin/years/${item.id}/activate`, { method: "PATCH" }, `${item.name} est maintenant l'année active.`)}>Activer</Button>}
                  <Button type="button" variant="outline" disabled={busy} onClick={() => setDeleteTarget({ path: `/academic/admin/years/${item.id}`, successMessage: "Année universitaire supprimée.", itemName: item.name })}><Trash2 className="size-4" />Supprimer</Button>
                </div>
              </div>)}</div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold">Parcours</h4>
                <form onSubmit={createProgram} className="flex gap-3">
                  <Input aria-label="Nom du parcours" value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Ex. Informatique" required />
                  <Button type="submit" disabled={busy}><Plus className="size-4" />Ajouter</Button>
                </form>
                <ul className="space-y-2">{structure.programs.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="font-medium">{item.name}{!item.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactif)</span>}</span>
                  <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => run(`/academic/admin/programs/${item.id}`, { method: "PATCH", body: { isActive: !item.isActive } }, item.isActive ? "Parcours désactivé." : "Parcours activé.")}>{item.isActive ? "Désactiver" : "Activer"}</Button><Button type="button" variant="outline" disabled={busy} aria-label={`Supprimer le parcours ${item.name}`} onClick={() => setDeleteTarget({ path: `/academic/admin/programs/${item.id}`, successMessage: "Parcours supprimé.", itemName: item.name })}><Trash2 className="size-4" /></Button></div>
                </li>)}</ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Niveaux</h4>
                <form onSubmit={createLevel} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <Input aria-label="Nom du niveau" value={level.name} onChange={(event) => setLevel({ ...level, name: event.target.value })} placeholder="Ex. Licence 1" required />
                  <Input aria-label="Ordre d'affichage" type="number" min="0" value={level.position} onChange={(event) => setLevel({ ...level, position: event.target.value })} />
                  <Button type="submit" disabled={busy}><Plus className="size-4" />Ajouter</Button>
                </form>
                <ul className="space-y-2">{structure.levels.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="font-medium">{item.name}{!item.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactif)</span>}</span>
                  <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => run(`/academic/admin/levels/${item.id}`, { method: "PATCH", body: { isActive: !item.isActive } }, item.isActive ? "Niveau désactivé." : "Niveau activé.")}>{item.isActive ? "Désactiver" : "Activer"}</Button><Button type="button" variant="outline" disabled={busy} aria-label={`Supprimer le niveau ${item.name}`} onClick={() => setDeleteTarget({ path: `/academic/admin/levels/${item.id}`, successMessage: "Niveau supprimé.", itemName: item.name })}><Trash2 className="size-4" /></Button></div>
                </li>)}</ul>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-2"><GraduationCap className="size-5 text-primary" /><h4 className="font-semibold">Classes et affectations</h4></div>
              <form onSubmit={createClass} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="class-group">Nom de classe ou groupe</Label><Input id="class-group" value={academicClass.name} onChange={(event) => setAcademicClass({ ...academicClass, name: event.target.value })} placeholder="Groupe A" required /></div>
                <div className="space-y-2"><Label htmlFor="class-year">Année universitaire</Label><select id="class-year" className="input-field" value={academicClass.academicYearId} onChange={(event) => setAcademicClass({ ...academicClass, academicYearId: event.target.value })} required><option value="">Choisir une année</option>{structure.years.map((item) => <option key={item.id} value={item.id}>{item.name}{item.isActive ? " (active)" : ""}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="class-program">Parcours</Label><select id="class-program" className="input-field" value={academicClass.programId} onChange={(event) => setAcademicClass({ ...academicClass, programId: event.target.value })} required><option value="">Choisir un parcours</option>{structure.programs.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="class-level">Niveau</Label><select id="class-level" className="input-field" value={academicClass.levelId} onChange={(event) => setAcademicClass({ ...academicClass, levelId: event.target.value })} required><option value="">Choisir un niveau</option>{structure.levels.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="class-teachers">Enseignants affectés (facultatif)</Label><select id="class-teachers" multiple value={academicClass.teacherIds} onChange={(event) => setAcademicClass({ ...academicClass, teacherIds: Array.from(event.target.selectedOptions, (option) => option.value) })} className="input-field min-h-28">{structure.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName} · {teacher.email}</option>)}</select><p className="text-xs text-muted-foreground">Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs enseignants.</p></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={busy || !structure.years.length || !structure.programs.length || !structure.levels.length}><Plus className="size-4" />Créer la classe</Button></div>
              </form>
              {structure.classes.length ? <div className="space-y-3">              {structure.classes.map((item) => <AcademicClassCard key={item.id} academicClass={item} teachers={structure.teachers} run={run} busy={busy} onDelete={(path, successMessage, itemName) => setDeleteTarget({ path, successMessage, itemName })} />)}</div> : <p className="text-sm text-muted-foreground">Aucune classe créée pour le moment.</p>}
            </section>
          </div>
        )}
      </SectionCard>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirmer la suppression ?"
        description="Cette action est définitive et ne peut pas être annulée."
        itemName={deleteTarget?.itemName}
        isBusy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
