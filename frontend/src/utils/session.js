export function readSession() {
  try {
    const userRaw = localStorage.getItem("educai_user");
    const accessToken = localStorage.getItem("educai_access_token");
    const refreshToken = localStorage.getItem("educai_refresh_token");
    const persisted = localStorage.getItem("educai_session");

    if (persisted) {
      const parsed = JSON.parse(persisted);
      return {
        user: parsed.user ?? (userRaw ? JSON.parse(userRaw) : null),
        accessToken: parsed.accessToken ?? accessToken,
        refreshToken: parsed.refreshToken ?? refreshToken,
      };
    }

    return {
      user: userRaw ? JSON.parse(userRaw) : null,
      accessToken,
      refreshToken,
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

export function getCurrentUserName(user = null) {
  const safeUser = user ?? readSession().user;

  if (!safeUser) return "Admin";

  const firstName = safeUser.firstName ?? safeUser.first_name ?? "";
  const lastName = safeUser.lastName ?? safeUser.last_name ?? "";
  const username = safeUser.username ?? safeUser.email ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || username || "Admin";
}

export function getCurrentUserRoleLabel(user = null) {
  const safeUser = user ?? readSession().user;
  const role = String(safeUser?.role ?? "ADMIN").toUpperCase();

  if (role === "ADMIN") return "administrateur";
  if (role === "TEACHER") return "enseignant";
  if (role === "STUDENT") return "étudiant";

  return "administrateur";
}

export function getCurrentUserSession() {
  const { user } = readSession();

  return {
    user,
    userName: getCurrentUserName(user),
    role: getCurrentUserRoleLabel(user),
  };
}

export function saveSession({ user, accessToken, refreshToken }) {
  const nextUser = user ?? null;

  if (nextUser) {
    localStorage.setItem("educai_user", JSON.stringify(nextUser));
  }

  if (accessToken) {
    localStorage.setItem("educai_access_token", accessToken);
  }

  if (refreshToken) {
    localStorage.setItem("educai_refresh_token", refreshToken);
  }

  localStorage.setItem(
    "educai_session",
    JSON.stringify({
      user: nextUser,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      updatedAt: Date.now(),
    })
  );
}

export function clearSession() {
  localStorage.removeItem("educai_user");
  localStorage.removeItem("educai_access_token");
  localStorage.removeItem("educai_refresh_token");
  localStorage.removeItem("educai_session");
}

export function getCurrentRole() {
  const { user } = readSession();
  return String(user?.role ?? "").toUpperCase();
}
