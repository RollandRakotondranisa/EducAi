import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Camera, CheckCircle2, Download, Eye, GraduationCap, Loader2, Mail, MoreVertical, Pencil, ShieldCheck, Trash2, UserPlus, Users, X, Search } from "lucide-react";
import { SectionCard, EmptyState, StatCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readSession } from "@/utils/session";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ROLES = ["all", "teacher", "student", "admin"];
const labels = { all: "Tous", teacher: "Enseignants", student: "Étudiants", admin: "Administrateurs" };

const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem("educai_access_token")}`,
});

const errorText = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

// Badges avec styles différenciés par rôle
const roleBadge = (role) => {
  const r = String(role).toLowerCase();
  const classMap = {
    teacher: "badge-role-teacher",
    student: "badge-role-student",
    admin: "badge-role-admin",
  };
  const icons = {
    teacher: <GraduationCap className="size-3" />,
    student: <Users className="size-3" />,
    admin: <ShieldCheck className="size-3" />,
  };
  return (
    <span className={`badge-role ${classMap[r] || "badge-role-teacher"}`}>
      {icons[r]}
      {labels[r] || role}
    </span>
  );
};

// Indicateur de statut avec pastille animée
const StatusIndicator = ({ status }) => {
  const isActive = status === "active";
  const dotClass = isActive ? "status-dot-active" : "status-dot-pending";
  const statusLabel = isActive ? "Actif" : status === "pending" ? "En attente" : "Désactivé";
  return (
    <span className="inline-flex items-center text-sm font-medium">
      <span className={`status-dot ${dotClass}`}></span>
      {statusLabel}
    </span>
  );
};

// Avatar avec photo ou initiales
const Avatar = ({ name, avatar, size = 40 }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size / 3 }}
      aria-hidden="true"
    >
      {avatar ? (
        <img
          src={avatar}
          alt={`Photo de ${name.trim() || "l'utilisateur"}`}
          className="size-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
};

function Modal({ title, close, children, wide = false }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [close]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`modal-content card-surface w-full ${wide ? "max-w-2xl" : "max-w-md"} p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h2 id="modal-title" className="font-display text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateUser({ close, done }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
    matricule: "",
    phone: "",
    specialty: "",
    classesHeld: "",
    university: "",
    academicTitle: "",
    bio: "",
    avatar: "",
  });
  const [academicOptions, setAcademicOptions] = useState({ academicYear: null, programs: [], levels: [], classes: [] });
  const [academicChoice, setAcademicChoice] = useState({ programId: "", levelId: "", classId: "" });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/academic/options`, { headers: headers() })
      .then(({ data }) => setAcademicOptions(data?.data || { academicYear: null, programs: [], levels: [], classes: [] }))
      .catch((loadError) => setOptionsError(errorText(loadError, "Impossible de charger les parcours et classes.")))
      .finally(() => setLoadingOptions(false));
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function changeAcademicChoice(name, value) {
    setAcademicChoice((current) => ({
      ...current,
      [name]: value,
      ...(name === "programId" ? { levelId: "", classId: "" } : {}),
      ...(name === "levelId" ? { classId: "" } : {}),
    }));
  }

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Choisissez une photo au format PNG ou JPG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Impossible de lire la photo sélectionnée.");
        return;
      }
      setError("");
      setForm((current) => ({ ...current, avatar: reader.result }));
    };
    reader.onerror = () => setError("Impossible de lire la photo sélectionnée.");
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        role: form.role.toUpperCase(),
        ...(form.role === "student" ? { academicClassId: academicChoice.classId } : {}),
      };
      const response = await axios.post(`${API_BASE}/auth/admin/users`, payload, { headers: headers() });
      done(response.data.data);
    } catch (submitError) {
      setError(errorText(submitError, "Impossible de créer cet utilisateur."));
    } finally {
      setSaving(false);
    }
  }

  const availableLevels = academicOptions.levels.filter((level) =>
    academicOptions.classes.some((item) => String(item.programId) === String(academicChoice.programId) && String(item.levelId) === String(level.id))
  );
  const availableClasses = academicOptions.classes.filter((item) =>
    String(item.programId) === String(academicChoice.programId) && String(item.levelId) === String(academicChoice.levelId)
  );

  return (
    <Modal title="Créer un nouvel utilisateur" close={close} wide>
      <form onSubmit={submit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="firstName" placeholder="Prénom" value={form.firstName} onChange={change} required maxLength={100} aria-label="Prénom" />
          <Input name="lastName" placeholder="Nom" value={form.lastName} onChange={change} required maxLength={100} aria-label="Nom" />
        </div>
        <Input name="email" type="email" placeholder="Adresse e-mail" value={form.email} onChange={change} required maxLength={150} aria-label="Adresse e-mail" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Rôle
            <select name="role" className="input-field w-full" value={form.role} onChange={change}>
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Mot de passe initial
            <Input name="password" type="password" value={form.password} onChange={change} required minLength={8} maxLength={128} autoComplete="new-password" />
          </label>
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">Le mot de passe initial n’est pas envoyé par e-mail. Transmettez-le à l’utilisateur par un canal sécurisé.</p>

        {form.role === "student" ? (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Informations étudiant</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="matricule" placeholder="Matricule" value={form.matricule} onChange={change} required maxLength={80} aria-label="Matricule" />
              <Input name="phone" type="tel" placeholder="Téléphone" value={form.phone} onChange={change} required maxLength={30} aria-label="Téléphone" />
              <select aria-label="Parcours" className="input-field" value={academicChoice.programId} onChange={(event) => changeAcademicChoice("programId", event.target.value)} disabled={loadingOptions || !academicOptions.academicYear}>
                <option value="">Choisir un parcours</option>
                {academicOptions.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
              </select>
              <select aria-label="Niveau" className="input-field" value={academicChoice.levelId} onChange={(event) => changeAcademicChoice("levelId", event.target.value)} disabled={!academicChoice.programId}>
                <option value="">Choisir un niveau</option>
                {availableLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
              <select aria-label="Classe / groupe" className="input-field sm:col-span-2" value={academicChoice.classId} onChange={(event) => changeAcademicChoice("classId", event.target.value)} disabled={!academicChoice.levelId} required>
                <option value="">Choisir une classe</option>
                {availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            {academicOptions.academicYear && <p className="text-xs text-muted-foreground">Année universitaire active : {academicOptions.academicYear.name}</p>}
            {!loadingOptions && !academicOptions.academicYear && <p className="text-sm text-error" role="alert">Aucune année universitaire active : configurez les parcours et classes avant de créer un étudiant.</p>}
            {optionsError && <p className="text-sm text-error" role="alert">{optionsError}</p>}
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Informations enseignant</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="specialty" placeholder="Spécialité" value={form.specialty} onChange={change} maxLength={150} aria-label="Spécialité" />
              <Input name="academicTitle" placeholder="Titre académique" value={form.academicTitle} onChange={change} maxLength={120} aria-label="Titre académique" />
              <Input name="university" placeholder="Établissement" value={form.university} onChange={change} maxLength={180} aria-label="Établissement" />
              <Input name="classesHeld" placeholder="Classes enseignées" value={form.classesHeld} onChange={change} maxLength={255} aria-label="Classes enseignées" />
            </div>
            <textarea name="bio" className="input-field min-h-20 w-full" placeholder="Biographie" value={form.bio} onChange={change} maxLength={5000} aria-label="Biographie" />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="new-user-photo" className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Camera className="size-4" />
            Ajouter une photo (PNG/JPG, 2 Mo maximum)
          </label>
          <input id="new-user-photo" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={selectPhoto} />
          {form.avatar && (
            <div className="flex items-center gap-3">
              <img src={form.avatar} alt="Aperçu de la photo" className="size-14 rounded-full object-cover" />
              <Button type="button" variant="outline" onClick={() => setForm((current) => ({ ...current, avatar: "" }))}>Retirer la photo</Button>
            </div>
          )}
        </div>

        {error && <div className="flex items-start gap-2 rounded-lg bg-error-soft p-3 text-sm text-error" role="alert"><AlertTriangle className="mt-0.5 size-4 flex-shrink-0" /><span>{error}</span></div>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>Annuler</Button>
          <Button className="btn flex-1" disabled={saving || (form.role === "student" && (!academicOptions.academicYear || loadingOptions))}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            <span>{saving ? "Création..." : "Créer l’utilisateur"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Invite({ close, done }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post(
        `${API_BASE}/auth/admin/users/invite`,
        { email, role },
        { headers: headers() }
      );
      done(email);
    } catch (err) {
      setError(errorText(err, "Impossible d'envoyer l'invitation."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Inviter un utilisateur" close={close}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label
            htmlFor="invite-email"
            className="mb-2 block text-sm font-medium"
          >
            Adresse e-mail
          </label>
          <Input
            id="invite-email"
            type="email"
            required
            placeholder="exemple@educai.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? "invite-error" : undefined}
          />
        </div>
        <div>
          <label
            htmlFor="invite-role"
            className="mb-2 block text-sm font-medium"
          >
            Rôle
          </label>
          <select
            id="invite-role"
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="teacher">Enseignant</option>
            <option value="student">Étudiant</option>
          </select>
        </div>

        {error && (
          <div
            id="invite-error"
            className="flex items-start gap-2 rounded-lg bg-error-soft p-3 text-sm text-error"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={close}
          >
            Annuler
          </Button>
          <Button className="flex-1 btn" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            <span>{saving ? "Envoi..." : "Envoyer"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Profile({ user, close }) {
  const isStudent = String(user.role).toLowerCase() === "student";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Étudiant";

  const details = [
    ["Identifiant", user.id],
    ["Téléphone", user.phone],
    ["Établissement", user.organization?.name || user.organizationName],
    ["Matricule", user.matricule],
    ["Niveau", user.level],
    ["Parcours", user.program],
    ["Spécialité", user.specialty],
    ["Classes enseignées", user.classesHeld],
    ["Université", user.university],
    ["Titre académique", user.academicTitle],
    ["Profil étudiant", user.studentProfileCompleted ? "Complété" : "À compléter"],
    ["Créé le", user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : null],
    ["Mis à jour le", user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("fr-FR") : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  function downloadStudentCard() {
    const escapeXml = (value) => String(value || "Non renseigné").replace(/[<>&"']/g, (character) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "\"": "&quot;",
      "'": "&apos;",
    })[character]);
    const initials = fullName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const photo = typeof user.avatar === "string" && user.avatar.startsWith("data:image/")
      ? `<image href="${escapeXml(user.avatar)}" x="68" y="190" width="190" height="190" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
      : `<text x="163" y="302" text-anchor="middle" fill="#0b3c5d" font-family="Arial, sans-serif" font-size="48" font-weight="700">${escapeXml(initials)}</text>`;
    const safeName = escapeXml(fullName);
    const safeMatricule = escapeXml(user.matricule);
    const safePhone = escapeXml(user.phone);
    const safeLevel = escapeXml(user.level);
    const safeProgram = escapeXml(user.program);
    const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3c5d"/><stop offset="1" stop-color="#126e8a"/></linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#68d5c5"/><stop offset="1" stop-color="#a5f3df"/></linearGradient>
        <clipPath id="photoClip"><circle cx="163" cy="285" r="95"/></clipPath>
      </defs>
      <rect width="900" height="560" rx="36" fill="#eef5f8"/>
      <rect x="14" y="14" width="872" height="532" rx="30" fill="url(#background)"/>
      <circle cx="825" cy="95" r="150" fill="#ffffff" opacity=".06"/>
      <circle cx="780" cy="48" r="82" fill="#ffffff" opacity=".05"/>
      <path d="M14 430 Q250 370 465 470 T886 430 V516 Q886 546 856 546 H44 Q14 546 14 516Z" fill="#072f49" opacity=".38"/>
      <rect x="58" y="58" width="58" height="58" rx="16" fill="url(#accent)"/>
      <path d="M87 69 105 76v13c0 13-8 22-18 27-10-5-18-14-18-27V76z" fill="#0b3c5d"/>
      <path d="m78 88 6 6 12-13" fill="none" stroke="#a5f3df" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="132" y="83" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="700">EduAI</text>
      <text x="132" y="108" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="13" letter-spacing="2.5">ESPACE ÉTUDIANT</text>
      <text x="838" y="86" text-anchor="end" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2">CARTE D'ÉTUDIANT</text>
      <line x1="58" y1="144" x2="842" y2="144" stroke="#ffffff" stroke-opacity=".2"/>
      <circle cx="163" cy="285" r="101" fill="#ffffff" opacity=".18"/>
      <circle cx="163" cy="285" r="95" fill="url(#accent)"/>
      ${photo}
      <text x="300" y="210" fill="#a5f3df" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">NOM COMPLET</text>
      <text x="300" y="250" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${safeName}</text>
      <text x="300" y="294" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">MATRICULE</text>
      <text x="300" y="320" fill="#ffffff" font-family="Arial, sans-serif" font-size="20">${safeMatricule}</text>
      <text x="300" y="362" fill="#c4e2ed" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">TÉLÉPHONE</text>
      <text x="300" y="388" fill="#ffffff" font-family="Arial, sans-serif" font-size="20">${safePhone}</text>
      <text x="58" y="458" fill="#a5f3df" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.6">PARCOURS</text>
      <text x="58" y="490" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="600">${safeProgram}</text>
      <text x="500" y="458" fill="#a5f3df" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.6">NIVEAU</text>
      <text x="500" y="490" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="600">${safeLevel}</text>
      <text x="842" y="526" text-anchor="end" fill="#a5f3df" font-family="Arial, sans-serif" font-size="11" letter-spacing="1.3">CARTE ÉTUDIANT • GÉNÉRÉE PAR EDUAI</text>
    </svg>`;

    const blob = new Blob([cardSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "etudiant";
    link.href = url;
    link.download = `carte-etudiant-${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Modal title="Profil utilisateur" close={close}>
      <div className="flex flex-col items-center pb-4">
        <Avatar name={`${user.firstName || ""} ${user.lastName || ""}`} avatar={user.avatar} size={72} />
        <h3 className="mt-4 font-display text-lg font-semibold">
          {user.firstName} {user.lastName}
        </h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="space-y-3 rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Rôle</span>
          {roleBadge(user.role)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Statut</span>
          <StatusIndicator status={user.status || (user.isActive ? "active" : "suspended")} />
        </div>
        {details.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-t border-border/60 pt-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="max-w-[65%] break-words text-right text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      {user.bio && (
        <div className="mt-4 rounded-lg border border-border p-4">
          <p className="mb-1 text-sm text-muted-foreground">Biographie</p>
          <p className="whitespace-pre-wrap text-sm">{user.bio}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1" onClick={close}>
          Fermer
        </Button>
        {isStudent && (
          <Button type="button" className="flex-1" onClick={downloadStudentCard}>
            <Download className="size-4" />
            Carte étudiant
          </Button>
        )}
      </div>
    </Modal>
  );
}

function Edit({ user, close, done }) {
  const currentUser = readSession().user;
  const isCurrentAdmin = Number(currentUser?.id) === Number(user.id) && String(user.role).toLowerCase() === "admin";
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: String(user.role).toLowerCase(),
    isActive: user.isActive !== false,
    matricule: user.matricule || "",
    level: user.level || "",
    program: user.program || "",
    phone: user.phone || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [academicOptions, setAcademicOptions] = useState({ academicYear: null, programs: [], levels: [], classes: [] });
  const [academicChoice, setAcademicChoice] = useState({ programId: "", levelId: "", classId: "" });
  const [initialClassId, setInitialClassId] = useState(String(user.academicClassId || ""));

  useEffect(() => {
    axios.get(`${API_BASE}/academic/options`, { headers: headers() })
      .then(({ data }) => {
        const options = data?.data || { academicYear: null, programs: [], levels: [], classes: [] };
        setAcademicOptions(options);
        const currentClass = user.academicClassId
          ? options.classes.find((item) => Number(item.id) === Number(user.academicClassId))
          : options.classes.find((item) => item.name && options.programs.some((program) => program.name === user.program && program.id === item.programId)
            && options.levels.some((level) => level.name === user.level && level.id === item.levelId));
        setInitialClassId(currentClass && Number(currentClass.id) === Number(user.academicClassId)
          ? String(currentClass.id)
          : String(user.academicClassId || ""));
        setAcademicChoice({
          programId: currentClass?.programId || "",
          levelId: currentClass?.levelId || "",
          classId: currentClass?.id || "",
        });
      })
      .catch((loadError) => setError(errorText(loadError, "Impossible de charger les choix académiques.")));
  }, [user.academicClassId, user.level, user.program]);

  const change = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  function changeAcademicChoice(event) {
    const { name, value } = event.target;
    setAcademicChoice((current) => ({
      ...current,
      [name]: value,
      ...(name === "programId" ? { levelId: "", classId: "" } : {}),
      ...(name === "levelId" ? { classId: "" } : {}),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await axios.put(
        `${API_BASE}/auth/admin/users/${user.id}`,
        {
          ...form,
          ...(form.role === "student" && String(academicChoice.classId) !== initialClassId
            ? { academicClassId: academicChoice.classId || null }
            : {}),
        },
        { headers: headers() }
      );
      done(response.data.data);
    } catch (err) {
      setError(errorText(err, "Impossible de modifier l'utilisateur."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Modifier l'utilisateur" close={close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Prénom"
            placeholder="Prénom"
            value={form.firstName}
            onChange={(e) => change("firstName", e.target.value)}
            required
          />
          <Input
            aria-label="Nom"
            placeholder="Nom"
            value={form.lastName}
            onChange={(e) => change("lastName", e.target.value)}
            required
          />
        </div>
        <Input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => change("email", e.target.value)}
          required
        />
        {form.role === "student" && (
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Matricule" value={form.matricule} onChange={(e) => change("matricule", e.target.value)} />
            <Input placeholder="Téléphone" value={form.phone} onChange={(e) => change("phone", e.target.value)} />
            <select aria-label="Parcours" className="input-field" name="programId" value={academicChoice.programId} onChange={changeAcademicChoice} disabled={!academicOptions.academicYear}>
              <option value="">Choisir un parcours</option>
              {academicOptions.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
            <select aria-label="Niveau" className="input-field" name="levelId" value={academicChoice.levelId} onChange={changeAcademicChoice} disabled={!academicChoice.programId}>
              <option value="">Choisir un niveau</option>
              {academicOptions.levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
            <select aria-label="Classe / groupe" className="input-field col-span-2" name="classId" value={academicChoice.classId} onChange={changeAcademicChoice} disabled={!academicChoice.levelId}>
              <option value="">Non affecté / choisir une classe</option>
              {academicOptions.classes.filter((item) => String(item.programId) === String(academicChoice.programId) && String(item.levelId) === String(academicChoice.levelId)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {academicOptions.academicYear && <p className="col-span-2 text-xs text-muted-foreground">Année active : {academicOptions.academicYear.name}</p>}
            {user.academicClassId && !academicChoice.classId && <p className="col-span-2 text-xs text-muted-foreground">L'affectation actuelle concerne une année non active; elle sera conservée tant qu'une nouvelle classe n'est pas choisie.</p>}
          </div>
        )}
        <select
          className="input-field"
          value={form.role}
          onChange={(e) => change("role", e.target.value)}
          disabled={isCurrentAdmin}
        >
          <option value="teacher">Enseignant</option>
          <option value="student">Étudiant</option>
          <option value="admin">Administrateur</option>
        </select>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => change("isActive", e.target.checked)}
            disabled={isCurrentAdmin}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">
            Compte actif{isCurrentAdmin ? " (votre compte administrateur ne peut pas être désactivé ici)" : ""}
          </span>
        </label>
        <p className="-mt-2 text-xs text-muted-foreground">
          Si le compte est désactivé, l'utilisateur ne pourra plus se connecter et ses sessions ouvertes seront révoquées.
        </p>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg bg-error-soft p-3 text-sm text-error"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={close}
          >
            Annuler
          </Button>
          <Button className="flex-1 btn" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Actions({ user, action }) {
  const [open, setOpen] = useState(false);
  const choose = (kind) => {
    setOpen(false);
    action(kind, user);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={`Actions pour ${user.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="size-5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="dropdown-menu absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-xl"
            role="menu"
          >
            <button
              className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm"
              onClick={() => choose("view")}
              role="menuitem"
            >
              <Eye className="size-4 text-primary" />
              Voir le profil
            </button>
            <button
              className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm"
              onClick={() => choose("edit")}
              role="menuitem"
            >
              <Pencil className="size-4 text-primary" />
              Modifier
            </button>
            <div className="my-1 border-t border-border"></div>
            <button
              className="dropdown-item flex w-full items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-soft"
              onClick={() => choose("delete")}
              role="menuitem"
            >
              <Trash2 className="size-4" />
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Skeleton Loader pour tableau
function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton size-10 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3"></div>
            <div className="skeleton h-3 w-1/2"></div>
          </div>
          <div className="skeleton h-6 w-20 rounded-full"></div>
          <div className="skeleton h-8 w-8 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [searchParams] = useSearchParams();
  const isSuperAdmin = Boolean(readSession().user?.isSuperAdmin);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [filter, setFilter] = useState(() => isSuperAdmin ? "admin" : "all");
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const visibleRoles = isSuperAdmin ? ["admin"] : ROLES;

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const notify = (type, message) => {
    setFeedback({ type, message, exiting: false });
    setTimeout(() => {
      setFeedback((f) => (f ? { ...f, exiting: true } : null));
      setTimeout(() => setFeedback(null), 300);
    }, 3500);
  };

  useEffect(() => {
    axios
      .get(`${API_BASE}/auth/admin/users`, { headers: headers() })
      .then((res) => setUsers(res.data.data || []))
      .catch((err) =>
        notify("error", errorText(err, "Erreur lors du chargement."))
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()) &&
          (isSuperAdmin
            ? u.role === "admin"
            : filter === "all"
              ? u.role !== "admin"
              : u.role === filter)
      ),
    [users, query, filter, isSuperAdmin]
  );

  const count = (role) => users.filter((u) => u.role === role).length;

  async function action(kind, user) {
    if (kind === "edit") {
      setSelected(user);
      setMode("edit");
      return;
    }
    if (kind === "view") {
      try {
        const res = await axios.get(
          `${API_BASE}/auth/admin/users/${user.id}`,
          { headers: headers() }
        );
        setSelected(res.data.data);
        setMode("view");
      } catch (err) {
        notify("error", errorText(err, "Impossible de charger le profil."));
      }
      return;
    }
    if (kind === "delete") {
      setDeleteTarget(user);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/auth/admin/users/${deleteTarget.id}`, {
        headers: headers(),
      });
      setUsers((all) => all.filter((user) => user.id !== deleteTarget.id));
      setDeleteTarget(null);
      notify("success", "Utilisateur supprimé.");
    } catch (err) {
      notify("error", errorText(err, "Impossible de supprimer l'utilisateur."));
    } finally {
      setDeleting(false);
    }
  }

  const toastClass = feedback
    ? feedback.type === "success"
      ? "toast-success"
      : feedback.type === "error"
      ? "toast-error"
      : "toast-info"
    : "";

  return (
    <>
      {/* === STAT CARDS === */}
      <div className={`grid gap-5 ${isSuperAdmin ? "" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        {isSuperAdmin ? (
          <StatCard
            className="stat-card"
            label="Administrateurs acceptés"
            value={String(count("admin"))}
            icon={ShieldCheck}
            accent="primary"
          />
        ) : (
          <>
            <StatCard
              className="stat-card"
              label="Total utilisateurs"
              value={String(users.length)}
              icon={Users}
              accent="primary"
            />
            <StatCard
              className="stat-card"
              label="Enseignants"
              value={String(count("teacher"))}
              icon={GraduationCap}
              accent="primary"
            />
            <StatCard
              className="stat-card"
              label="Étudiants"
              value={String(count("student"))}
              icon={Users}
              accent="success"
            />
            <StatCard
              className="stat-card"
              label="Administrateurs"
              value={String(count("admin"))}
              icon={ShieldCheck}
              accent="primary"
            />
          </>
        )}
      </div>

      {/* === RECHERCHE ET FILTRES === */}
      <SectionCard title="Recherche et filtres">
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher par nom ou e-mail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Recherche utilisateur"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleRoles.map((role) => (
              <button
                key={role}
                type="button"
                className={`filter-btn rounded-lg border border-border px-4 py-2 text-sm font-medium transition ${
                  filter === role ? "active" : "bg-background hover:bg-muted"
                }`}
                onClick={() => setFilter(role)}
              >
                {role === "all"
                  ? "Utilisateurs (hors admins)"
                  : isSuperAdmin
                    ? "Administrateurs acceptés"
                    : labels[role]}
                {role !== "all" && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      filter === role
                        ? "bg-white/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count(role)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* === LISTE DES UTILISATEURS === */}
      <SectionCard
        title={`${filtered.length} utilisateur${
          filtered.length > 1 ? "s" : ""
        }`}
        action={
          !isSuperAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button className="btn" onClick={() => setCreateUser(true)}>
                <UserPlus className="size-4" />
                Nouvel utilisateur
              </Button>
              <Button variant="outline" onClick={() => setInvite(true)}>
                <Mail className="size-4" />
                Inviter
              </Button>
            </div>
          )
        }
      >
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="empty-state py-12 text-center">
            <div className="empty-state-icon mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary-soft">
              <Users className="size-8 text-primary" />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">
              {query || filter !== "all"
                ? "Aucun résultat"
                : "Aucun utilisateur"}
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {query || filter !== "all"
                ? "Essayez avec d'autres termes de recherche."
                : "Créez votre premier utilisateur pour commencer."}
            </p>
            {!(query || filter !== "all") && !isSuperAdmin && (
              <div className="flex justify-center gap-2">
                <Button className="btn" onClick={() => setCreateUser(true)}>
                  <UserPlus className="size-4" />
                  Nouvel utilisateur
                </Button>
                <Button variant="outline" onClick={() => setInvite(true)}>
                  Inviter
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-strong bg-muted/40">
                    <TableHead className="font-semibold">Utilisateur</TableHead>
                    <TableHead className="font-semibold">Rôle</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user, i) => (
                    <TableRow
                      key={user.id}
                      className="eduai-table-row"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} avatar={user.avatar} />
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell>
                        <StatusIndicator status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Actions user={user} action={action} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-center">
              {!isSuperAdmin && (
                <Button variant="outline" onClick={() => setCreateUser(true)}>
                  <UserPlus className="size-4" />
                  Créer un nouvel utilisateur
                </Button>
              )}
            </div>
          </>
        )}
      </SectionCard>

      {/* === TOAST NOTIFICATIONS === */}
      {feedback && (
        <div
          className={`toast fixed bottom-6 right-6 flex items-center gap-3 rounded-lg p-4 ${toastClass} ${
            feedback.exiting ? "toast-exit" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5" />
          ) : feedback.type === "error" ? (
            <AlertTriangle className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* === MODALS === */}
      {createUser && !isSuperAdmin && (
        <CreateUser
          close={() => setCreateUser(false)}
          done={(created) => {
            const user = {
              ...created,
              name: `${created.firstName} ${created.lastName}`,
              role: String(created.role).toLowerCase(),
              status: created.isActive ? "active" : "suspended",
            };
            setUsers((all) => [user, ...all]);
            setCreateUser(false);
            notify("success", `Compte créé et e-mail de bienvenue envoyé à ${created.email}.`);
          }}
        />
      )}
      {invite && !isSuperAdmin && (
        <Invite
          close={() => setInvite(false)}
          done={(email) => {
            setInvite(false);
            notify("success", `Invitation envoyée à ${email}.`);
          }}
        />
      )}
      {mode === "view" && (
        <Profile
          user={selected}
          close={() => {
            setMode(null);
            setSelected(null);
          }}
        />
      )}
      {mode === "edit" && (
        <Edit
          user={selected}
          close={() => {
            setMode(null);
            setSelected(null);
          }}
          done={(updated) => {
            setUsers((all) =>
              all.map((u) =>
                u.id === updated.id
                  ? {
                      ...u,
                      ...updated,
                      name: `${updated.firstName} ${updated.lastName}`,
                      role: String(updated.role).toLowerCase(),
                      status: updated.isActive ? "active" : "suspended",
                    }
                  : u
              )
            );
            setMode(null);
            setSelected(null);
            notify("success", "Utilisateur modifié.");
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer l'utilisateur ?"
        description="Cette action est définitive et ne peut pas être annulée."
        itemName={deleteTarget?.name}
        detail={deleteTarget?.email}
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
