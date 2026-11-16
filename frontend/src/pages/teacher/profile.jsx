import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  School,
  ShieldCheck,
  User,
} from "lucide-react";

import { SectionCard } from "@/components/kit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import TeacherShell, { teacherNav } from "./teacherNav";
import apiFetch from "@/utils/api";
import { readSession, saveSession } from "@/utils/session";

function getFullName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PR";
}

function ProfileAvatar({ name, avatar, onChange, disabled }) {
  return (
    <div className="relative size-28 shrink-0">
      <div className="grid size-full place-items-center overflow-hidden rounded-full bg-primary-soft text-2xl font-semibold text-primary ring-4 ring-primary/10">
        {avatar ? (
          <img src={avatar} alt={`Photo de ${name}`} className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <label
        htmlFor="teacher-avatar-upload"
        className="absolute bottom-0 right-0 grid size-9 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary-accent"
        title="Modifier la photo de profil"
      >
        <Camera className="size-4" />
        <input
          id="teacher-avatar-upload"
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          disabled={disabled}
          onChange={onChange}
        />
      </label>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder, icon: Icon, ...props }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}
        <Input id={id} value={value || ""} onChange={onChange} placeholder={placeholder} className={Icon ? "pl-10" : ""} {...props} />
      </div>
    </div>
  );
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    specialty: "",
    classesHeld: "",
    university: "",
    academicTitle: "",
    bio: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });

  useEffect(() => {
    apiFetch("/auth/profile")
      .then((response) => {
        const user = response?.data || {};
        setProfile((current) => ({ ...current, ...user }));
        persistUser(user);
      })
      .catch((error) => setProfileError(error.message || "Impossible de charger votre profil."))
      .finally(() => setLoading(false));
  }, []);

  function persistUser(user) {
    const session = readSession();
    saveSession({
      user: { ...session.user, ...user },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setSuccessMessage("");

    try {
      const response = await apiFetch("/auth/profile", {
        method: "PUT",
        body: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          specialty: profile.specialty,
          university: profile.university,
          academicTitle: profile.academicTitle,
          bio: profile.bio,
        },
      });
      const user = response?.data || profile;
      setProfile((current) => ({ ...current, ...user }));
      persistUser(user);
      setSuccessMessage("Profil enseignant mis à jour avec succès.");
    } catch (error) {
      setProfileError(error.message || "Impossible de mettre à jour votre profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setSuccessMessage("");

    if (passwords.next.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (passwords.next !== passwords.confirmation) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch("/auth/profile/password", {
        method: "PUT",
        body: { currentPassword: passwords.current, newPassword: passwords.next },
      });
      setPasswords({ current: "", next: "", confirmation: "" });
      setSuccessMessage("Mot de passe mis à jour avec succès.");
    } catch (error) {
      setPasswordError(error.message || "Impossible de modifier le mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfileError("Choisissez une image PNG ou JPG de 2 Mo maximum.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await apiFetch("/auth/profile/avatar", {
          method: "PUT",
          body: { avatar: reader.result },
        });
        const user = response?.data || {};
        setProfile((current) => ({ ...current, ...user }));
        persistUser(user);
        setSuccessMessage("Photo de profil mise à jour avec succès.");
      } catch (error) {
        setProfileError(error.message || "Impossible de modifier la photo.");
      }
    };
    reader.readAsDataURL(file);
  }

  const fullName = getFullName(profile);

  return (
    <TeacherShell nav={teacherNav} role="enseignant" title="Mon profil" subtitle="Gérez vos informations personnelles et universitaires.">
      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Chargement du profil...
        </div>
      ) : (
        <div className="space-y-6">
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft p-4 text-sm font-medium text-success" role="status">
              <CheckCircle2 className="size-4 shrink-0" /> {successMessage}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-soft p-4 text-sm font-medium text-error" role="alert">
              <AlertTriangle className="size-4 shrink-0" /> {profileError}
            </div>
          )}

          <SectionCard title="Informations personnelles" description="Votre identité visible sur la plateforme EduAI.">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <ProfileAvatar name={fullName} avatar={profile.avatar} onChange={handleAvatarChange} disabled={savingProfile} />
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{fullName || "Profil enseignant"}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" /> {profile.email}</p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-medium text-primary"><ShieldCheck className="size-4" /> Enseignant universitaire</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="teacher-first-name" label="Prénom" name="firstName" value={profile.firstName} onChange={updateField} placeholder="Votre prénom" icon={User} required />
                <Field id="teacher-last-name" label="Nom" name="lastName" value={profile.lastName} onChange={updateField} placeholder="Votre nom" icon={User} required />
                <Field id="teacher-email" label="Adresse e-mail" name="email" type="email" value={profile.email} onChange={updateField} placeholder="professeur@universite.fr" icon={Mail} required />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Profil universitaire" description="Présentez votre domaine d'enseignement et votre contexte académique.">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="teacher-academic-title" label="Titre universitaire" name="academicTitle" value={profile.academicTitle} onChange={updateField} placeholder="Maître de conférences, Professeur..." icon={GraduationCap} />
                <Field id="teacher-specialty" label="Spécialité" name="specialty" value={profile.specialty} onChange={updateField} placeholder="Droit public, Informatique..." icon={BookOpen} />
                <Field id="teacher-university" label="Université / établissement" name="university" value={profile.university} onChange={updateField} placeholder="Université de Lyon" icon={School} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-bio">Présentation professionnelle</Label>
                <textarea id="teacher-bio" name="bio" value={profile.bio || ""} onChange={updateField} rows="5" placeholder="Présentez votre parcours, vos matières et vos domaines de recherche..." className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {savingProfile ? "Enregistrement..." : "Enregistrer les informations universitaires"}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Classes affectées" description="Les affectations de classes sont gérées par l'administrateur.">
            {profile.assignedClasses?.length ? (
              <ul className="space-y-3">
                {profile.assignedClasses.map((academicClass) => (
                  <li key={academicClass.id} className="rounded-xl border border-border p-4">
                    <p className="font-medium">{academicClass.program?.name} · {academicClass.level?.name} · {academicClass.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{academicClass.academicYear?.name}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Aucune classe ne vous est affectée pour l'année universitaire active.</p>}
          </SectionCard>

          <SectionCard title="Sécurité du compte" description="Modifiez votre mot de passe enseignant.">
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-3">
                <Field id="current-password" label="Mot de passe actuel" name="current" type="password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} required />
                <Field id="new-password" label="Nouveau mot de passe" name="next" type="password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} required />
                <Field id="confirm-password" label="Confirmer le mot de passe" name="confirmation" type="password" value={passwords.confirmation} onChange={(event) => setPasswords((current) => ({ ...current, confirmation: event.target.value }))} required />
              </div>
              {passwordError && <p className="flex items-center gap-2 text-sm font-medium text-error" role="alert"><AlertTriangle className="size-4" /> {passwordError}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                  {savingPassword ? "Mise à jour..." : "Modifier le mot de passe"}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      )}
    </TeacherShell>
  );
}
