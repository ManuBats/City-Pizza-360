import { useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, Send, UtensilsCrossed } from "lucide-react";
import { LogoutButton, RequireRole, useWorkerSession } from "@/components/worker-auth";
import { PRODUCTOS, soles } from "@/lib/pizzas";

type LineaComanda = { productoId: string; nombre: string; tamano: "Personal" | "Familiar"; precio: number; qty: number };

type Comanda = { id: string; mesa: number; items: LineaComanda[]; nota: string; total: number; hora: string };

const MESAS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MesaPage() {
  return (
    <RequireRole roles={["mesero", "admin"]}>
      <MesaContent />
    </RequireRole>
  );
}

function MesaContent() {
  const { data: session } = useWorkerSession();
  const [mesa, setMesa] = useState<number | null>(null);
  const [lineas, setLineas] = useState<LineaComanda[]>([]);
  const [nota, setNota] = useState("");
  const [enviadas, setEnviadas] = useState<Comanda[]>([]);
  const [tamanoPorId, setTamanoPorId] = useState<Record<string, "Personal" | "Familiar">>({});

  const total = useMemo(() => lineas.reduce((acc, l) => acc + l.precio * l.qty, 0), [lineas]);

  function agregar(productoId: string, nombre: string, precioPersonal: number, precioFamiliar: number, esBebida: boolean) {
    const tamano = esBebida ? "Personal" : (tamanoPorId[productoId] ?? "Familiar");
    const precio = tamano === "Personal" ? precioPersonal : precioFamiliar;
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.productoId === productoId && l.tamano === tamano);
      if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productoId, nombre, tamano, precio, qty: 1 }];
    });
  }

  function cambiarQty(index: number, delta: number) {
    setLineas((prev) =>
      prev
        .map((l, i) => (i === index ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function enviarACocina() {
    if (mesa === null || lineas.length === 0) return;
    const comanda: Comanda = {
      id: `#M${String(enviadas.length + 1).padStart(3, "0")}`,
      mesa,
      items: lineas,
      nota: nota.trim(),
      total,
      hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
    };
    setEnviadas((prev) => [comanda, ...prev]);
    setLineas([]);
    setNota("");
    setMesa(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-extrabold leading-tight">Tomar pedido en mesa</p>
              <p className="text-xs text-white/60">{session?.nombre ?? "Salón"}</p>
            </div>
          </div>
          <LogoutButton dark />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Selector de mesa */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Mesa</h2>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {MESAS.map((n) => (
              <button
                key={n}
                onClick={() => setMesa(n)}
                className={`btn-tactile min-h-12 rounded-xl text-base font-extrabold transition-colors ${
                  mesa === n ? "bg-primary text-white" : "bg-card border border-border hover:border-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Carta */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Carta</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {PRODUCTOS.filter((p) => p.disponible).map((p) => {
                const esBebida = p.categoria === "Bebidas";
                const tamano = tamanoPorId[p.id] ?? "Familiar";
                const precio = esBebida || tamano === "Personal" ? p.precioPersonal : p.precioFamiliar;
                return (
                  <div key={p.id} className="card-soft p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{p.nombre}</p>
                      <span className="shrink-0 rounded-full bg-secondary/25 px-2.5 py-0.5 text-xs font-bold text-brand-black">
                        {soles(precio)}
                      </span>
                    </div>
                    {!esBebida && (
                      <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                        {(["Personal", "Familiar"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTamanoPorId((prev) => ({ ...prev, [p.id]: t }))}
                            className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                              tamano === t ? "bg-primary text-white" : "text-muted-foreground"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => agregar(p.id, p.nombre, p.precioPersonal, p.precioFamiliar, esBebida)}
                      className="btn-tactile mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 bg-brand-black text-sm text-white transition-colors hover:bg-brand-black/90"
                    >
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Comanda actual */}
          <aside className="card-soft h-fit p-5 lg:sticky lg:top-20">
            <h2 className="font-bold">Comanda {mesa !== null ? `· Mesa ${mesa}` : ""}</h2>
            {lineas.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Elige una mesa y agrega productos de la carta.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lineas.map((l, i) => (
                  <li key={`${l.productoId}-${l.tamano}`} className="flex items-center gap-2 rounded-xl border border-border p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.tamano} · {soles(l.precio)}
                      </p>
                    </div>
                    <button
                      onClick={() => cambiarQty(i, -1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-muted"
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                    <button
                      onClick={() => cambiarQty(i, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-muted"
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota para cocina (ej. sin aceitunas)"
              rows={2}
              className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-extrabold">
              <span>Total</span>
              <span className="text-primary">{soles(total)}</span>
            </div>
            <button
              onClick={enviarACocina}
              disabled={mesa === null || lineas.length === 0}
              className="btn-tactile mt-3 flex w-full items-center justify-center gap-2 bg-primary text-base text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-5 w-5" /> Enviar a cocina
            </button>
          </aside>
        </div>

        {/* Comandas enviadas */}
        {enviadas.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Enviadas a cocina
            </h2>
            <ul className="mt-2 space-y-2">
              {enviadas.map((c) => (
                <li key={c.id} className="card-soft flex items-center gap-3 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {c.id} · Mesa {c.mesa} · {c.hora}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.items.map((l) => `${l.qty}× ${l.nombre} (${l.tamano})`).join(", ")}
                      {c.nota ? ` — Nota: ${c.nota}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-extrabold text-primary">{soles(c.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
