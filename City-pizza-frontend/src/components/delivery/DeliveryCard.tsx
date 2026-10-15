import { MapPin, Phone } from "lucide-react";
import { mapsUrl, type Entrega } from "@/hooks/use-entregas";

interface DeliveryCardProps {
  entrega: Entrega;
  onAvanzar: (id: string) => void;
}

/** Tarjeta de entrega activa (extraída de routes/delivery.tsx). */
export function DeliveryCard({ entrega: e, onAvanzar }: DeliveryCardProps) {
  return (
    <article className="card-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold">{e.cliente}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            Pedido {e.id} · {e.resumen}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            e.estado === "en-camino"
              ? "bg-secondary text-brand-black"
              : "bg-primary/10 text-primary"
          }`}
        >
          {e.estado === "en-camino" ? "En camino" : "Pendiente"}
        </span>
      </div>

      <a
        href={mapsUrl(e.direccion)}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-start gap-2 rounded-2xl bg-muted p-3 transition-colors hover:bg-muted/70"
      >
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>
          <span className="block text-sm font-semibold">{e.direccion}</span>
          {e.referencia && (
            <span className="block text-xs text-muted-foreground">Ref: {e.referencia}</span>
          )}
          <span className="mt-1 block text-xs font-bold text-primary">Abrir en Maps →</span>
        </span>
      </a>

      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
        <a
          href={`tel:+51${e.celular}`}
          className="btn-tactile grid w-14 place-items-center rounded-xl bg-brand-black text-white"
          aria-label={`Llamar a ${e.cliente}`}
        >
          <Phone className="h-5 w-5" />
        </a>
        <button
          onClick={() => onAvanzar(e.id)}
          className="btn-tactile bg-primary text-base text-white transition-colors hover:bg-primary/90"
        >
          {e.estado === "pendiente" ? "En Camino" : "Entregado ✓"}
        </button>
      </div>
    </article>
  );
}
