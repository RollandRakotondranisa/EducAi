import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

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
      await login({
        email,
        password,
        deviceInfo:
          "EduAI Web Browser",
      });

      // Redirection selon le rôle
      const user =
        JSON.parse(
          localStorage.getItem(
            "educai_user"
          )
        );

      if (user?.role === "TEACHER") {
        navigate({
          to: "/enseignant",
        });
      } else if (
        user?.role === "STUDENT"
      ) {
        navigate({
          to: "/etudiant",
        });
      } else if (
        user?.role === "ADMIN"
      ) {
        navigate({
          to: "/admin",
        });
      } else {
        navigate({
          to: "/",
        });
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