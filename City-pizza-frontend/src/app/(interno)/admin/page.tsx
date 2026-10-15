import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bike, ChefHat, Package, Pencil, Plus, Tag, Trash2, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { LogoutButton, RequireRole } from "@/components/worker/worker-auth";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { LOCAL, soles } from "@/lib/pizzas";
import type { TabAdmin } from "@/types/admin";

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  );
}

function AdminDashboard() {
  const {
    tab, setTab,
    pedidos, avanzarPedido,
    productos, toggleDisponible,
    promos, togglePromo, promoAEliminar, setPromoAEliminar, confirmarEliminarPromo,
    inventario, ajustarStock, alertas,
    kpis,
    siguienteEstado,
  } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Panel Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              City Pizza Center · San Vicente de Cañete
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-brand-black">
              {LOCAL.horario}
            </span>
            <Link
              to="/admin/usuarios"
              className="btn-tactile inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-black px-4 text-sm text-white transition-colors hover:bg-brand-black/90"
            >
              <Users className="h-4 w-4" /> Usuarios
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="card-soft p-4">
              <k.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">{k.valor}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1">
          {(
            [
              ["pedidos", "Pedidos en vivo"],
              ["catalogo", "Catálogo y Promos"],
              ["inventario", `Inventario${alertas.length ? ` (${alertas.length})` : ""}`],
            ] as [TabAdmin, string][]
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
                  <p className="mt-1 text-sm font-semibold">
                    {p.cliente} · {p.celular}
                  </p>
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

        {tab === "catalogo" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Productos */}
            <div className="card-soft p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Productos</h2>
                <button className="btn-tactile flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm text-white">
                  <Plus className="h-4 w-4" /> Nuevo
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {productos.map((prod) => (
                  <li
                    key={prod.id}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{prod.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {prod.categoria} · Pers {soles(prod.precioPersonal)} · Fam {soles(prod.precioFamiliar)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleDisponible(prod.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        prod.disponible
                          ? "bg-secondary text-brand-black"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prod.disponible ? "Disponible" : "Agotado"}
                    </button>
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-muted" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Promos */}
            <div className="card-soft h-fit p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Promociones</h2>
                <button className="btn-tactile flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm text-white">
                  <Plus className="h-4 w-4" /> Nueva
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {promos.map((promo) => (
                  <li
                    key={promo.id}
                    className="flex items-center gap-3 rounded-2xl border border-border p-3"
                  >
                    <Tag className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{promo.titulo}</p>
                      <p className="text-xs text-muted-foreground">{promo.detalle}</p>
                    </div>
                    <button
                      onClick={() => togglePromo(promo.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        promo.activa ? "bg-secondary text-brand-black" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {promo.activa ? "Activa" : "Pausada"}
                    </button>
                    <button
                      onClick={() => setPromoAEliminar({ id: promo.id, titulo: promo.titulo })}
                      className="grid h-9 w-9 place-items-center rounded-full text-primary"
                      aria-label="Eliminar promo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {tab === "inventario" && (
          <section className="mt-6 space-y-4">
            {alertas.length > 0 && (
              <div className="flex items-start gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-bold text-primary">
                    {alertas.length === 1 ? "1 insumo bajo de stock" : `${alertas.length} insumos bajos de stock`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {alertas.map((a) => a.nombre).join(", ")} — repón antes del pico de la noche.
                  </p>
                </div>
              </div>
            )}
            <div className="card-soft overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Insumo</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Mínimo</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((ins) => {
                    const bajo = ins.stock <= ins.minimo;
                    return (
                      <tr key={ins.nombre} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-semibold">{ins.nombre}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => ajustarStock(ins.nombre, -1)}
                              className="grid h-7 w-7 place-items-center rounded-full bg-muted text-base font-bold"
                              aria-label="Restar stock"
                            >
                              −
                            </button>
                            <span className="w-14 text-center font-bold">
                              {ins.stock} {ins.unidad}
                            </span>
                            <button
                              onClick={() => ajustarStock(ins.nombre, 1)}
                              className="grid h-7 w-7 place-items-center rounded-full bg-muted text-base font-bold"
                              aria-label="Sumar stock"
                            >
                              +
                            </button>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ins.minimo} {ins.unidad}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              bajo ? "bg-primary/10 text-primary" : "bg-secondary text-brand-black"
                            }`}
                          >
                            {bajo ? "Bajo" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <DeleteConfirmDialog
        open={promoAEliminar !== null}
        entityLabel="promoción"
        itemName={promoAEliminar?.titulo}
        onClose={() => setPromoAEliminar(null)}
        onConfirm={confirmarEliminarPromo}
      />
    </div>
  );
}
