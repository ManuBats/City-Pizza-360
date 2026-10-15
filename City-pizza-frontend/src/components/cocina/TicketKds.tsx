import { Timer } from "lucide-react";
import { minutosDesde, type TicketKds } from "@/hooks/use-cola";

interface TicketKdsProps {
  ticket: TicketKds;
  ahora: number;
  onIniciar: (id: string) => void;
  onListo: (id: string) => void;
}

/** Comanda del KDS (extraída de routes/cocina.tsx). */
export function TicketKds({ ticket: t, ahora, onIniciar, onListo }: TicketKdsProps) {
  const min = minutosDesde(t.recibidoEn, ahora);
  const tarde = min >= 15;
  return (
    <article
      className={`flex flex-col rounded-3xl border-2 bg-white p-5 text-brand-black ${
        tarde ? "border-primary" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold">{t.id}</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {t.cliente} · {t.entrega}
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${
            tarde ? "bg-primary text-white" : "bg-muted text-foreground"
          }`}
        >
          <Timer className="h-4 w-4" />
          {min} min
        </span>
      </div>

      <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
        {t.items.map((item, i) => (
          <li key={i}>
            <p className="text-lg font-bold">
              <span className="mr-2 inline-grid h-7 min-w-7 place-items-center rounded-lg bg-secondary px-1 text-sm font-extrabold text-brand-black">
                {item.qty}×
              </span>
              {item.nombre}
            </p>
            {item.nota && (
              <p className="ml-9 mt-0.5 rounded-lg bg-secondary/40 px-2 py-1 text-xs font-semibold text-brand-black">
                Nota: {item.nota}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {t.estado === "nuevo" ? (
          <button
            onClick={() => onIniciar(t.id)}
            className="btn-tactile w-full bg-brand-black text-lg text-white transition-colors hover:bg-brand-black/90"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={() => onListo(t.id)}
            className="btn-tactile w-full bg-primary text-lg text-white transition-colors hover:bg-primary/90"
          >
            ¡Listo!
          </button>
        )}
      </div>
    </article>
  );
}
