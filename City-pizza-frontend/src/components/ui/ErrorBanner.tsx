import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  mensaje: string;
  onReintentar?: () => void;
}

/** Banner de error con reintento (listas que fallan por red). */
export function ErrorBanner({ mensaje, onReintentar }: ErrorBannerProps) {
  return (
    <div className="card-soft flex flex-wrap items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
        <AlertTriangle className="h-5 w-5 text-primary" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold">{mensaje}</p>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="btn-tactile inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm text-white transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}
