import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";

import { useAuth } from "../../hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();

  const {
    login,
    loading,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [remember, setRemember] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearError();

    try {
      const result = await login({
        email,
        password,
        deviceInfo:
          "EduAI Web Browser",
      });

      const user = result?.user ?? result?.data?.user ?? null;
      const accessToken = result?.accessToken ?? result?.data?.accessToken ?? null;
      const refreshToken = result?.refreshToken ?? result?.data?.refreshToken ?? null;
      const role = String(user?.role ?? "").toUpperCase();

      if (user) {
        localStorage.setItem("educai_user", JSON.stringify(user));
      }
      if (accessToken) {
        localStorage.setItem("educai_access_token", accessToken);
      }
      if (refreshToken) {
        localStorage.setItem("educai_refresh_token", refreshToken);
      }
      localStorage.setItem(
        "educai_session",
        JSON.stringify({ user, accessToken, refreshToken, updatedAt: Date.now() })
      );

      if (role === "ADMIN") {
        navigate({ to: "/admin" });
      } else if (role === "TEACHER") {
        navigate({ to: "/enseignant" });
      } else if (role === "STUDENT") {
        navigate({ to: "/etudiant" });
      } else {
        navigate({ to: "/" });
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );
    }
  };

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">
          Adresse e-mail
        </Label>

        <Input
          id="email"
          type="email"
          placeholder="prenom.nom@universite.fr"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Mot de passe
        </Label>

        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={remember}
            onCheckedChange={setRemember}
          />

          Se souvenir de moi
        </label>

        <span className="cursor-pointer text-sm text-primary">
          Mot de passe oublié ?
        </span>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl"
      >
        {loading
          ? "Connexion..."
          : "Se connecter"}
      </Button>
    </form>
  );
}