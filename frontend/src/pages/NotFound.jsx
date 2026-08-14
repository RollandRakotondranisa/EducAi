import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-semibold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Cette page n'existe pas</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Le lien est peut-être erroné, ou la page a été déplacée.
        </p>
        <Button asChild className="mt-8 rounded-xl">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}