import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  entityLabel: string;
  itemName?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de borrado (equivale a ui/DeleteConfirmDialog de CCA). */
export function DeleteConfirmDialog({
  open,
  entityLabel,
  itemName,
  submitting = false,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/60 p-4" onClick={onClose}>
      <div
        className="card-soft w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-label={`Eliminar ${entityLabel}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
          <Trash2 className="h-6 w-6 text-primary" />
        </span>
        <h2 className="mt-4 text-lg font-bold">Eliminar {entityLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {itemName ? (
            <>¿Eliminar <strong className="text-foreground">“{itemName}”</strong>? Esta acción no se puede deshacer.</>
          ) : (
            <>¿Eliminar? Esta acción no se puede deshacer.</>
          )}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className={cn("btn-tactile bg-muted text-foreground hover:bg-muted/70")}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="btn-tactile inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
