import { CheckCircle2, Minus, Plus, Send, UtensilsCrossed } from "lucide-react";
import { RequireRole } from "@/components/worker/worker-auth";
import { StaffLayout } from "@/app/layouts/StaffLayout";
import { useComanda } from "@/hooks/use-comanda";
import { soles } from "@/lib/pizzas";
import { usePizzas } from "@/hooks/use-pizzas";
import { MESAS } from "@/types/mesa";

export default function MesaPage() {
  return (
    <RequireRole roles={["mesero", "admin"]}>
      <MesaContent />
    </RequireRole>
  );
}

function MesaContent() {
  const {
    mesa, setMesa,
    lineas, nota, setNota, enviadas,
    nombre, setNombre, celular, setCelular,
    metodoPago, setMetodoPago, enviando,
    tamanoPorId, setTamano,
    total,
    agregar, cambiarQty, enviarACocina,
  } = useComanda();
  const { productos: carta } = usePizzas();

  return (
    <StaffLayout
      icon={<UtensilsCrossed className="h-5 w-5 text-white" />}
      title="Tomar pedido en mesa"
      subtitle="Salón"
    >
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
              {carta.filter((p) => p.disponible).map((p) => {
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
                            onClick={() => setTamano(p.id, t)}
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Cliente"
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                value={celular}
                onChange={(e) => setCelular(e.target.value.replace(/\D/g, "").slice(0, 9))}
                inputMode="numeric"
                placeholder="Celular"
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["Efectivo", "Yape"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                    metodoPago === m ? "bg-primary text-white" : "text-muted-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-extrabold">
              <span>Total</span>
              <span className="text-primary">{soles(total)}</span>
            </div>
            <button
              onClick={() => void enviarACocina()}
              disabled={mesa === null || lineas.length === 0 || enviando}
              className="btn-tactile mt-3 flex w-full items-center justify-center gap-2 bg-primary text-base text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-5 w-5" /> {enviando ? "Enviando…" : "Enviar a cocina"}
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
    </StaffLayout>
  );
}
