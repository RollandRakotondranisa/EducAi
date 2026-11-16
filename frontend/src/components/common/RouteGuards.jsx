import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import apiFetch from "@/utils/api";
import { clearSession, readSession } from "@/utils/session";

export function roleHome(role) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/enseignant";
  if (role === "STUDENT") return "/etudiant";
  return "/";
}

function rolePath(role) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/enseignant";
  if (role === "STUDENT") return "/etudiant";
  return "/";
}

export function PublicRoute({ children }) {
  const { user, accessToken } = readSession();
  const role = String(user?.role || "").toUpperCase();
  if (user && accessToken && role) return <Navigate to={rolePath(role)} replace />;
  return children;
}

export function HomeRoute({ children }) {
  const { user, accessToken } = readSession();
  const role = String(user?.role || "").toUpperCase();
  if (user && accessToken && role) return <Navigate to={rolePath(role)} replace />;
  return children;
}

export function SessionProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const session = readSession();
  const role = String(session.user?.role || "").toUpperCase();
  const [checking, setChecking] = useState(Boolean(session.user && session.accessToken));
  const [valid, setValid] = useState(Boolean(session.user && session.accessToken));

  useEffect(() => {
    let active = true;
    if (!session.user || !session.accessToken) {
      setChecking(false);
      setValid(false);
      return undefined;
    }
    apiFetch("/auth/me")
      .then(() => active && setValid(true))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) clearSession();
        setValid(false);
      })
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, [session.accessToken]);

  if (checking) return <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">Vérification de la session...</div>;
  if (!valid || !session.user || !role) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return <Navigate to={roleHome(role)} replace />;
  if (role === "STUDENT" && !session.user.studentProfileCompleted && location.pathname !== "/etudiant/profil") {
    return <Navigate to="/etudiant/profil" replace state={{ profileRequired: true, from: location.pathname }} />;
  }
  return children;
}
