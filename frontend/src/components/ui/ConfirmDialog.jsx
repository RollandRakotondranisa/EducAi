import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "./Button";

export default function ConfirmDialog({
  open,
  title,
  description,
  itemName,
  detail,
  confirmLabel = "Supprimer",
  isBusy = false,
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const isBusyRef = useRef(isBusy);
  onCancelRef.current = onCancel;
  isBusyRef.current = isBusy;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    cancelButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isBusyRef.current) {
        onCancelRef.current();
      } else if (event.key === "Tab") {
        const firstButton = cancelButtonRef.current;
        const lastButton = confirmButtonRef.current;
        if (event.shiftKey && document.activeElement === firstButton) {
          event.preventDefault();
          lastButton?.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          firstButton?.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-error-soft text-error">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h2 id="confirm-delete-title" className="font-display text-xl font-semibold">
              {title}
            </h2>
            <p id="confirm-delete-description" className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {itemName && (
          <div className="rounded-xl border border-error/25 bg-error-soft/50 p-4">
            <p className="break-words text-sm font-semibold text-foreground">{itemName}</p>
            {detail && <p className="mt-1 break-words text-xs text-muted-foreground">{detail}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
          >
            Annuler
          </Button>
          <Button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isBusy}
            variant="destructive"
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isBusy ? "Suppression..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
