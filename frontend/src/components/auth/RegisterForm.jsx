import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";

import { useAuth } from "../../hooks/useAuth";

export default function RegisterForm() {
  const navigate = useNavigate();

  const {
    register,
    loading,
    error,
  } = useAuth();

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("TEACHER");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        role,
      });

      alert(
        "Compte créé avec succès. Vous pouvez maintenant vous connecter."
      );

      navigate({
        to: "/connexion",
      });
    } catch (error) {
      console.error(
        "Register error:",
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstname">
            Prénom
          </Label>

          <Input
            id="firstname"
            value={firstName}
            onChange={(e) =>
              setFirstName(
                e.target.value
              )
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastname">
            Nom
          </Label>

          <Input
            id="lastname"
            value={lastName}
            onChange={(e) =>
              setLastName(
                e.target.value
              )
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Adresse e-mail
        </Label>

        <Input
          id="email"
          type="email"
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
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Je suis
        </legend>

        <RadioGroup
          value={role}
          onValueChange={setRole}
          className="grid grid-cols-2 gap-3"
        >
          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <RadioGroupItem
              value="TEACHER"
              id="teacher"
            />

            Enseignant
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <RadioGroupItem
              value="STUDENT"
              id="student"
            />

            Étudiant
          </label>
        </RadioGroup>
      </fieldset>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl"
      >
        {loading
          ? "Création..."
          : "Créer mon compte"}
      </Button>
    </form>
  );
}