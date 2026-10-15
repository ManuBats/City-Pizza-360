import { Banknote, Bike, ChefHat, Clock, Package, Plus, Tag } from "lucide-react";
import { RequireRole } from "@/components/worker/worker-auth";
import { StaffLayout } from "@/app/layouts/StaffLayout";
import { useCajero, type TabCajero } from "@/hooks/use-cajero";
import { soles } from "@/lib/pizzas";

export default function CajeroPage() {
  return (
    <RequireRole roles={["cajero", "admin"]}>
      <CajeroContent />
    </RequireRole>
  );
}

function CajeroContent() {
  const {
    tab, setTab,
    pedidos, avanzarPedido,
    productos, toggleDisponible,
    promos,
    titulo, setTitulo, detalle, setDetalle, horas, setHoras,
    errorPromo, crearPromo,
    siguienteEstado,
  } = useCajero();

  return (
    <StaffLayout
      icon={<Banknote className="h-5 w-5 text-white" />}
      title="Caja"
      subtitle="Turno noche"
    >
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1">
          {(
            [
              ["pedidos", "Pedidos"],
              ["carta", "Carta (Disponible/Agotado)"],
              ["promo", "Promo flash"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "pedidos" && (
          <section className="mt-6 space-y-3">
            {pedidos.map((p) => (
              <article key={p.id} className="card-soft flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-extrabold">{p.id}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.estado === "Entregado"
                          ? "bg-muted text-muted-foreground"
                          : p.estado === "En camino"
                            ? "bg-secondary text-brand-black"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {p.estado}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {p.entrega === "Delivery" ? <Bike className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                      {p.entrega} · {p.hora}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{p.cliente}</p>
                  <p className="text-sm text-muted-foreground">{p.items}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-extrabold text-primary">{soles(p.total)}</span>
                  {siguienteEstado[p.estado] && (
                    <button
                      onClick={() => avanzarPedido(p.id)}
                      className="btn-tactile flex items-center gap-2 bg-primary px-5 text-sm text-white transition-colors hover:bg-primary/90"
                    >
                      <ChefHat className="h-4 w-4" />
                      {siguienteEstado[p.estado]}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === "carta" && (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((prod) => (
              <div key={prod.id} className="card-soft flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{prod.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {prod.categoria} · Fam {soles(prod.precioFamiliar)}
                  </p>
                </div>
                <button
                  onClick={() => toggleDisponible(prod.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    prod.disponible ? "bg-secondary text-brand-black" : "bg-primary/10 text-primary"
                  }`}
                >
                  {prod.disponible ? "Disponible" : "Agotado"}
                </button>
              </div>
            ))}
          </section>
        )}

        {tab === "promo" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <form onSubmit={crearPromo} className="card-soft h-fit p-5">
              <h2 className="font-bold">Nueva promo flash</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Promos rápidas de turno: duran máximo 48 horas.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej. Noche de Pepperoni"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Detalle</label>
                  <input
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    placeholder="Ej. Pepperoni familiar + gaseosa 1L por S/38"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vigencia (horas, máx 48)</label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={horas}
                    onChange={(e) => setHoras(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                {errorPromo && <p className="text-sm font-semibold text-primary">{errorPromo}</p>}
                <button
                  type="submit"
                  className="btn-tactile flex w-full items-center justify-center gap-2 bg-primary text-white transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" /> Publicar promo
                </button>
              </div>
            </form>

            <div className="card-soft h-fit p-5">
              <h2 className="font-bold">Promos activas del turno</h2>
              {promos.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Aún no hay promos flash. Crea una para impulsar la noche.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {promos.map((promo) => (
                    <li key={promo.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                      <Tag className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{promo.titulo}</p>
                        <p className="text-xs text-muted-foreground">{promo.detalle}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-primary">
                          <Clock className="h-3 w-3" />
                          Vence {new Date(promo.venceEn).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </StaffLayout>
  );
}
