import { useState } from "react";
import { Bike, Timer } from "lucide-react";
import { minutosDesde, type Repartidor, type TicketKds } from "@/hooks/use-cola";

interface TicketKdsProps {
  ticket: TicketKds;
  ahora: number;
  repartidores: Repartidor[];
  onIniciar: (id: number) => void;
  onListo: (id: number) => void;
  onAsignar: (id: number, repartidorId: number) => void;
}

/** Comanda del KDS con datos reales del backend. */
export function TicketKds({ ticket: t, ahora, repartidores, onIniciar, onListo, onAsignar }: TicketKdsProps) {
  const min = minutosDesde(t.recibidoEn, ahora);
  const tarde = min >= 15;
  const [repId, setRepId] = useState("");

  return (
    <article
      className={`flex flex-col rounded-3xl border-2 bg-white p-5 text-brand-black ${
        tarde ? "border-primary" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold">{t.codigo}</p>
          <p className="text-sm font-semibold text-muted-foreground">
            {t.cliente} · {t.entrega}
          </p>
          {t.yapePendiente && (
            <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-brand-black">
              Yape por verificar
            </span>
          )}
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

      <div className="mt-4 flex gap-2">
        <select
          value={t.repartidorId ? String(t.repartidorId) : repId}
          disabled={Boolean(t.repartidorId)}
          onChange={(e) => setRepId(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60"
          aria-label="Repartidor"
        >
          <option value="">Repartidor…</option>
          {repartidores.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        {!t.repartidorId && (
          <button
            onClick={() => repId && onAsignar(t.id, Number(repId))}
            disabled={!repId}
            className="btn-tactile inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-black px-4 text-sm text-white disabled:opacity-40"
          >
            <Bike className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3">
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
