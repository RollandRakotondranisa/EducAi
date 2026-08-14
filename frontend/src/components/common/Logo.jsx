import React from "react";
import { Sparkles } from "lucide-react";

export default function Logo({
  dark = false,
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`
          grid size-9 place-items-center rounded-xl
          ${
            dark
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "bg-primary text-primary-foreground"
          }
        `}
      >
        <Sparkles className="size-4" />
      </span>

      <span
        className={`
          text-lg font-semibold tracking-tight
          ${
            dark
              ? "text-sidebar-foreground"
              : "text-foreground"
          }
        `}
      >
        EduAI
      </span>
    </div>
  );
}