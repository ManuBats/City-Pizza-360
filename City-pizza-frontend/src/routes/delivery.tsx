import { useState } from "react";
import { Bike, CheckCircle2, MapPin, Phone } from "lucide-react";
import { LogoutButton, RequireRole } from "@/components/worker-auth";

/** Solo delivery (y admin) con JWT válido; el resto ve 403. */
export default function DeliveryRoute() {
  return (
    <RequireRole roles={["delivery", "admin"]}>
      <DeliveryPage />
    </RequireRole>
  );
}

type Entrega = {
  id: string;
  cliente: string;
  celular: string;
  direccion: string;
  referencia?: string;
  resumen: string;
  estado: "pendiente" | "en-camino" | "entregado";
};

const ENTREGAS_INICIALES: Entrega[] = [
  {
    id: "#0125",
    cliente: "María Torres",
    celular: "999111222",
    direccion: "Jr. Grau 123, San Vicente de Cañete",
    referencia: "Frente al parque, puerta negra",
    resumen: "Americana Familiar + Cuatro Quesos Personal",
    estado: "en-camino",
  },
  {
    id: "#0127",
    cliente: "Rosa Quispe",
    celular: "987654321",
    direccion: "Av. Sepúlveda 450, San Vicente de Cañete",
    referencia: "Casa amarilla, segundo piso",
    resumen: "Hawaiana Familiar + Gaseosa 1L",
    estado: "pendiente",
  },
  {
    id: "#0124",
    cliente: "Jorge Huamán",
    celular: "955444333",
    direccion: "Calle Los Pinos 88, San Vicente de Cañete",
    resumen: "Familiar Carnes",
    estado: "entregado",
  },
];

function mapsUrl(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Perú")}`;
}

function DeliveryPage() {
  // Mock temporal.
  // TODO(módulo Delivery): GET mis-entregas + PATCH /pedidos/:id/estado.
  const [entregas, setEntregas] = useState(ENTREGAS_INICIALES);

  const activas = entregas.filter((e) => e.estado !== "entregado");
  const hechas = entregas.filter((e) => e.estado === "entregado");

  const avanzar = (id: string) =>
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, estado: e.estado === "pendiente" ? "en-camino" : "entregado" }
          : e,
      ),
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black text-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary">
              <Bike className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-extrabold leading-tight">Mis Entregas</p>
              <p className="text-xs text-white/60">Turno noche · City Pizza Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand-black">
              {activas.length} pendientes
            </span>
            <LogoutButton dark />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {activas.map((e) => (
          <article key={e.id} className="card-soft p-5">
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
                onClick={() => avanzar(e.id)}
                className="btn-tactile bg-primary text-base text-white transition-colors hover:bg-primary/90"
              >
                {e.estado === "pendiente" ? "En Camino" : "Entregado ✓"}
              </button>
            </div>
          </article>
        ))}

        {activas.length === 0 && (
          <div className="card-soft py-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-extrabold">¡Todo entregado!</p>
            <p className="text-sm text-muted-foreground">Vuelve al local por más pedidos.</p>
          </div>
        )}

        {hechas.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Completadas hoy
            </h2>
            <ul className="space-y-2">
              {hechas.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 opacity-70"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {e.id} · {e.cliente}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.direccion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
