import { useEffect, useState } from "react";
import { Bell, Flame, Timer } from "lucide-react";
import { LogoutButton, RequireRole } from "@/components/worker-auth";

/** Solo cocina (y admin) con JWT válido; el resto ve 403. */
export default function CocinaRoute() {
  return (
    <RequireRole roles={["cocina", "admin"]}>
      <CocinaPage />
    </RequireRole>
  );
}

type Item = { qty: number; nombre: string; nota?: string };

type Ticket = {
  id: string;
  cliente: string;
  entrega: "Delivery" | "Recojo";
  recibidoEn: number; // epoch ms
  estado: "nuevo" | "preparando";
  items: Item[];
};

const AHORA = Date.now();

const TICKETS_INICIALES: Ticket[] = [
  {
    id: "#0125",
    cliente: "María Torres",
    entrega: "Delivery",
    recibidoEn: AHORA - 21 * 60_000,
    estado: "preparando",
    items: [
      { qty: 1, nombre: "Americana Familiar" },
      { qty: 1, nombre: "Cuatro Quesos Personal", nota: "Sin aceitunas" },
    ],
  },
  {
    id: "#0126",
    cliente: "Carlos Mendoza",
    entrega: "Recojo",
    recibidoEn: AHORA - 9 * 60_000,
    estado: "preparando",
    items: [{ qty: 2, nombre: "Pepperoni Personal", nota: "Extra queso en una" }],
  },
  {
    id: "#0127",
    cliente: "Rosa Quispe",
    entrega: "Delivery",
    recibidoEn: AHORA - 2 * 60_000,
    estado: "nuevo",
    items: [
      { qty: 1, nombre: "Hawaiana Familiar" },
      { qty: 1, nombre: "Gaseosa 1L", nota: "Inca Kola" },
    ],
  },
];

function minutosDesde(ts: number, ahora: number) {
  return Math.max(0, Math.floor((ahora - ts) / 60_000));
}

function CocinaPage() {
  const [tickets, setTickets] = useState(TICKETS_INICIALES);
  const [ahora, setAhora] = useState(Date.now());

  // Mock temporal: polling cada 3s refresca timers y simula comandas.
  // TODO(módulo Cocina): GET /cocina/cola cada 3s + PATCH /pedidos/:id/estado.
  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(Date.now());
      setTickets((prev) => {
        const siguiente = 128 + Math.floor((Date.now() - AHORA) / 30_000);
        const existe = prev.some((t) => t.id === `#0${siguiente}`);
        if (existe || prev.length >= 6) return prev;
        return [
          ...prev,
          {
            id: `#0${siguiente}`,
            cliente: "Cliente mostrador",
            entrega: "Recojo" as const,
            recibidoEn: Date.now(),
            estado: "nuevo" as const,
            items: [{ qty: 1, nombre: "Suprema Familiar" }],
          },
        ];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nuevos = tickets.filter((t) => t.estado === "nuevo");
  const preparando = tickets.filter((t) => t.estado === "preparando");

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary">
              <Flame className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight">Cocina — KDS</p>
              <p className="text-xs text-white/60">City Pizza Center · actualiza cada 3s</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
              <Bell className="h-4 w-4 text-secondary" />
              {tickets.length} activas
            </div>
            <LogoutButton dark />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-2 xl:grid-cols-3">
        {tickets.map((t) => {
          const min = minutosDesde(t.recibidoEn, ahora);
          const tarde = min >= 15;
          return (
            <article
              key={t.id}
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
                    onClick={() =>
                      setTickets((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, estado: "preparando" } : x)),
                      )
                    }
                    className="btn-tactile w-full bg-brand-black text-lg text-white transition-colors hover:bg-brand-black/90"
                  >
                    Iniciar
                  </button>
                ) : (
                  <button
                    onClick={() => setTickets((prev) => prev.filter((x) => x.id !== t.id))}
                    className="btn-tactile w-full bg-primary text-lg text-white transition-colors hover:bg-primary/90"
                  >
                    ¡Listo!
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {tickets.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <p className="text-2xl font-extrabold text-white/80">Sin comandas activas</p>
            <p className="mt-1 text-sm text-white/50">Las nuevas aparecerán aquí automáticamente.</p>
          </div>
        )}
      </main>

      {/* Resumen fijo inferior */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-brand-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-3 text-sm font-bold">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-secondary" /> Nuevas: {nuevos.length}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" /> Preparando: {preparando.length}
          </span>
        </div>
      </footer>
    </div>
  );
}
