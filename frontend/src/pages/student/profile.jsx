import { useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, KeyRound, Loader2, LockKeyhole, LogOut, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import apiFetch from "@/utils/api";
import { clearSession, readSession, saveSession } from "@/utils/session";
import { studentNav } from "./StudentNav";

function fullName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ET";
}

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", matricule: "", level: "", program: "", phone: "", avatar: "", academicClassId: null, academicClass: null, studentProfileCompleted: false });
  const [academicOptions, setAcademicOptions] = useState({ academicYear: null, programs: [], levels: [], classes: [] });
  const [academicChoice, setAcademicChoice] = useState({ programId: "", levelId: "", classId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    Promise.all([apiFetch("/auth/profile"), apiFetch("/academic/options")])
      .then(([profileResponse, optionsResponse]) => {
        const user = profileResponse?.data || {};
        const options = optionsResponse?.data || { academicYear: null, programs: [], levels: [], classes: [] };
        setAcademicOptions(options);
        setAcademicChoice({
          programId: user.academicClass?.programId || "",
          levelId: user.academicClass?.levelId || "",
          classId: user.academicClassId || "",
        });
        setProfile((current) => ({ ...current, ...user }));
        saveUser(user);
      })
      .catch((loadError) => setError(loadError.message || "Impossible de charger votre profil."))
      .finally(() => setLoading(false));
  }, []);

  function saveUser(user) {
    const session = readSession();
    saveSession({ user: { ...session.user, ...user }, accessToken: session.accessToken, refreshToken: session.refreshToken });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function updateAcademicChoice(event) {
    const { name, value } = event.target;
    setAcademicChoice((current) => ({
      ...current,
      [name]: value,
      ...(name === "programId" ? { levelId: "", classId: "" } : {}),
      ...(name === "levelId" ? { classId: "" } : {}),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch("/auth/profile", {
        method: "PUT",
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          matricule: profile.matricule,
          academicClassId: Number(academicChoice.classId),
          phone: profile.phone,
        },
      });
      const user = response?.data || {};
      setProfile((current) => ({ ...current, ...user }));
      saveUser(user);
      setSuccess("Profil étudiant enregistré. Ces informations sont maintenant gérées par l'administrateur.");
    } catch (submitError) {
      setError(submitError.message || "Impossible d'enregistrer votre profil.");
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choisissez une image PNG ou JPG de 2 Mo maximum.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await apiFetch("/auth/profile/avatar", { method: "PUT", body: { avatar: reader.result } });
        const user = response?.data || {};
        setProfile((current) => ({ ...current, ...user }));
        saveUser(user);
        setSuccess("Photo de profil mise à jour.");
      } catch (avatarError) {
        setError(avatarError.message || "Impossible de modifier la photo.");
      }
    };
    reader.readAsDataURL(file);
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setSuccess("");
    if (!passwords.current || !passwords.next) return setPasswordError("Les deux mots de passe sont obligatoires.");
    if (passwords.next.length < 8) return setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (passwords.next !== passwords.confirmation) return setPasswordError("Les mots de passe ne correspondent pas.");
    setSavingPassword(true);
    try {
      await apiFetch("/auth/profile/password", { method: "PUT", body: { currentPassword: passwords.current, newPassword: passwords.next } });
      setPasswords({ current: "", next: "", confirmation: "" });
      setSuccess("Mot de passe modifié avec succès.");
    } catch (passwordSubmitError) {
      setPasswordError(passwordSubmitError.message || "Impossible de modifier le mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearSession();
    navigate("/connexion", { replace: true });
  }

  const completed = Boolean(profile.studentProfileCompleted);
  const name = fullName(profile);

  return (
    <AppShell nav={studentNav} role="étudiant" title="Mon profil étudiant" subtitle={completed ? "Vos informations personnelles et universitaires." : "Complétez votre profil avant de continuer."}>
      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-5 animate-spin" /> Chargement du profil...</div>
      ) : (
        <div className="space-y-6">
          {!completed && <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning" role="status"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><span>La complétion de ces informations est obligatoire lors de votre première connexion.</span></div>}
          {error && <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-soft p-4 text-sm font-medium text-error" role="alert"><AlertTriangle className="size-4" />{error}</div>}
          {success && <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft p-4 text-sm font-medium text-success" role="status"><CheckCircle2 className="size-4" />{success}</div>}

          <SectionCard title="Identité de l'étudiant" description="Informations utilisées pour votre dossier universitaire.">
            <form onSubmit={submit} className="space-y-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-2xl font-semibold text-primary ring-4 ring-primary/10">
                  {profile.avatar ? <img src={profile.avatar} alt={`Photo de ${name}`} className="size-full object-cover" /> : initials(name)}
                  <label htmlFor="student-avatar" className="absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground" title="Modifier la photo"><Camera className="size-4" /><input id="student-avatar" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={changeAvatar} /></label>
                </div>
                <div><h3 className="text-xl font-semibold">{name || "Étudiant"}</h3><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" />{profile.email}</p><p className="mt-2 flex items-center gap-2 text-xs font-medium text-primary"><ShieldCheck className="size-4" />Compte étudiant</p></div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="student-first-name" label="Prénom" name="firstName" value={profile.firstName} onChange={updateField} icon={User} disabled={completed} required />
                <Field id="student-last-name" label="Nom complet" name="lastName" value={profile.lastName} onChange={updateField} icon={User} disabled={completed} required />
                <Field id="student-matricule" label="Matricule" name="matricule" value={profile.matricule} onChange={updateField} placeholder="Ex. 2026-ETU-001" disabled={completed} required />
                {completed ? <>
                  <Field id="student-level" label="Niveau" name="level" value={profile.level} disabled />
                  <Field id="student-program" label="Parcours" name="program" value={profile.program} disabled />
                  <div className="space-y-2"><Label htmlFor="student-academic-class">Classe / année d'inscription</Label><div id="student-academic-class" className="input-field min-h-10">{profile.academicClass ? `${profile.academicClass.name} · ${profile.academicClass.academicYear?.name || ""}` : "Non renseignée"}</div></div>
                </> : <>
                  <div className="space-y-2">
                    <Label htmlFor="student-program">Parcours</Label>
                    <select id="student-program" name="programId" className="input-field" value={academicChoice.programId} onChange={updateAcademicChoice} disabled={!academicOptions.academicYear} required>
                      <option value="">Choisir un parcours</option>
                      {academicOptions.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-level">Niveau</Label>
                    <select id="student-level" name="levelId" className="input-field" value={academicChoice.levelId} onChange={updateAcademicChoice} disabled={!academicChoice.programId} required>
                      <option value="">Choisir un niveau</option>
                      {academicOptions.levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-class">Classe / groupe</Label>
                    <select id="student-class" name="classId" className="input-field" value={academicChoice.classId} onChange={updateAcademicChoice} disabled={!academicChoice.levelId} required>
                      <option value="">Choisir une classe</option>
                      {academicOptions.classes.filter((item) => String(item.programId) === String(academicChoice.programId) && String(item.levelId) === String(academicChoice.levelId)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </>}
                <Field id="student-phone" label="Téléphone" name="phone" value={profile.phone} onChange={updateField} placeholder="+33 6 00 00 00 00" icon={Phone} disabled={completed} required />
              </div>
              {completed && profile.academicClass ? (
                <p className="text-sm text-muted-foreground">Inscription actuelle : <strong className="text-foreground">{profile.academicClass.program?.name} · {profile.academicClass.level?.name} · {profile.academicClass.name} · {profile.academicClass.academicYear?.name}</strong></p>
              ) : academicOptions.academicYear ? (
                <p className="text-sm text-muted-foreground">Année universitaire active : <strong className="text-foreground">{academicOptions.academicYear.name}</strong></p>
              ) : !completed ? (
                <p className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning">L'administrateur doit d'abord créer et activer une année universitaire et ses classes.</p>
              ) : null}

              {completed ? <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground"><LockKeyhole className="size-4 shrink-0" />Ces informations sont verrouillées. Contactez l'administrateur pour toute modification.</div> : <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{saving ? "Enregistrement..." : "Enregistrer mon profil"}</Button></div>}
            </form>
          </SectionCard>

          <SectionCard title="Sécurité du compte" description="Modifiez le mot de passe de votre compte étudiant.">
            <form onSubmit={changePassword} className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <Field id="student-current-password" label="Mot de passe actuel" name="currentPassword" type="password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} required />
                <Field id="student-new-password" label="Nouveau mot de passe" name="newPassword" type="password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} required />
                <Field id="student-confirm-password" label="Confirmer le mot de passe" name="confirmation" type="password" value={passwords.confirmation} onChange={(event) => setPasswords((current) => ({ ...current, confirmation: event.target.value }))} required />
              </div>
              {passwordError && <p className="flex items-center gap-2 text-sm font-medium text-error" role="alert"><AlertTriangle className="size-4" />{passwordError}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={savingPassword}>{savingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{savingPassword ? "Mise à jour..." : "Modifier le mot de passe"}</Button></div>
            </form>
          </SectionCard>

          <SectionCard title="Terminer la session" description="Fermez votre session sur cet appareil.">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3 text-sm text-muted-foreground"><LogOut className="mt-0.5 size-5 shrink-0 text-error" /><span>Vous devrez vous reconnecter pour accéder à votre espace étudiant.</span></div><Button type="button" className="bg-error text-white hover:bg-error/90" onClick={() => setShowLogoutConfirm(true)}><LogOut className="size-4" />Se déconnecter</Button></div>
          </SectionCard>

          {showLogoutConfirm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="student-logout-title"><div className="w-full max-w-md rounded-xl bg-background p-6 shadow-2xl"><h2 id="student-logout-title" className="text-lg font-semibold">Confirmer la déconnexion</h2><p className="mt-2 text-sm text-muted-foreground">Cette action va fermer votre session étudiant.</p><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowLogoutConfirm(false)}>Annuler</Button><Button type="button" className="bg-error text-white hover:bg-error/90" onClick={handleLogout}><LogOut className="size-4" />Se déconnecter</Button></div></div></div>}
        </div>
      )}
    </AppShell>
  );
}

function Field({ id, label, name, value, onChange, icon: Icon, ...props }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="relative">{Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}<Input id={id} name={name} value={value || ""} onChange={onChange} className={Icon ? "pl-10" : ""} {...props} /></div></div>;
}
