import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bike,
  ChefHat,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { LogoutButton, RequireRole } from "@/components/worker/worker-auth";
import { LOCAL, PRODUCTOS, soles, type Producto } from "@/lib/pizzas";

/* ---------- Datos simulados (mock temporal) ---------- */
// TODO(módulos Pedidos/Catálogo/Inventario/Reportes): reemplazar por
// GET /pedidos, GET /pizzas, GET /inventario + dashboard del backend.

type EstadoPedido = "Recibido" | "En cocina" | "Listo" | "En camino" | "Entregado";

type Pedido = {
  id: string;
  cliente: string;
  celular: string;
  items: string;
  total: number;
  estado: EstadoPedido;
  entrega: "Delivery" | "Recojo";
  hora: string;
};

const PEDIDOS_INICIALES: Pedido[] = [
  { id: "#0127", cliente: "Rosa Quispe", celular: "987 654 321", items: "1× Hawaiana Familiar, 1× Gaseosa 1L", total: 45, estado: "Recibido", entrega: "Delivery", hora: "20:31" },
  { id: "#0126", cliente: "Carlos Mendoza", celular: "912 345 678", items: "2× Pepperoni Personal", total: 38, estado: "En cocina", entrega: "Recojo", hora: "20:24" },
  { id: "#0125", cliente: "María Torres", celular: "999 111 222", items: "1× Americana Familiar, 1× Cuatro Quesos Personal", total: 59, estado: "En camino", entrega: "Delivery", hora: "20:10" },
  { id: "#0124", cliente: "Jorge Huamán", celular: "955 444 333", items: "1× Familiar Carnes", total: 42, estado: "Entregado", entrega: "Delivery", hora: "19:48" },
  { id: "#0123", cliente: "Ana Flores", celular: "933 222 111", items: "1× Vegetariana Familiar, 2× Gaseosa Personal", total: 42, estado: "Entregado", entrega: "Recojo", hora: "19:30" },
];

const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  Recibido: "En cocina",
  "En cocina": "Listo",
  Listo: "En camino",
  "En camino": "Entregado",
};

type Insumo = { nombre: string; stock: number; minimo: number; unidad: string };

const INVENTARIO_INICIAL: Insumo[] = [
  { nombre: "Queso mozzarella", stock: 2, minimo: 5, unidad: "kg" },
  { nombre: "Pepperoni", stock: 8, minimo: 3, unidad: "kg" },
  { nombre: "Jamón", stock: 6, minimo: 3, unidad: "kg" },
  { nombre: "Piña en trozos", stock: 4, minimo: 2, unidad: "kg" },
  { nombre: "Masa premezcla", stock: 30, minimo: 10, unidad: "unds" },
  { nombre: "Salsa de tomate", stock: 7, minimo: 4, unidad: "L" },
  { nombre: "Gaseosa 1L", stock: 18, minimo: 6, unidad: "unds" },
];

type Promo = { id: string; titulo: string; detalle: string; activa: boolean };

const PROMOS_INICIALES: Promo[] = [
  { id: "p1", titulo: "2×1 Martes", detalle: "2 pizzas familiares clásicas por S/58", activa: true },
  { id: "p2", titulo: "Combo Familiar", detalle: "Familiar + Gaseosa 1L por S/45", activa: true },
  { id: "p3", titulo: "Personal + Gaseosa", detalle: "Pizza personal + gaseosa 500ml por S/20", activa: false },
];

type Tab = "pedidos" | "catalogo" | "inventario";

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboard />
    </RequireRole>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("pedidos");
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS);
  const [promos, setPromos] = useState(PROMOS_INICIALES);
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [promoAEliminar, setPromoAEliminar] = useState<{ id: string; titulo: string } | null>(null);

  function confirmarEliminarPromo() {
    if (!promoAEliminar) return;
    setPromos((prev) => prev.filter((x) => x.id !== promoAEliminar.id));
    setPromoAEliminar(null);
  }

  const activos = pedidos.filter((p) => p.estado !== "Entregado");
  const ventasHoy = pedidos.reduce((acc, p) => acc + p.total, 0);
  const alertas = inventario.filter((i) => i.stock <= i.minimo);

  const kpis = useMemo(
    () => [
      { icon: LayoutDashboard, label: "Pedidos hoy", valor: String(pedidos.length) },
      { icon: Clock, label: "En curso", valor: String(activos.length) },
      { icon: CheckCircle2, label: "Ventas hoy", valor: soles(ventasHoy) },
      { icon: AlertTriangle, label: "Alertas stock", valor: String(alertas.length) },
    ],
    [pedidos.length, activos.length, ventasHoy, alertas.length],
  );

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
            ] as [Tab, string][]
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
                  {SIGUIENTE_ESTADO[p.estado] && (
                    <button
                      onClick={() =>
                        setPedidos((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, estado: SIGUIENTE_ESTADO[p.estado]! } : x,
                          ),
                        )
                      }
                      className="btn-tactile flex items-center gap-2 bg-primary px-5 text-sm text-white transition-colors hover:bg-primary/90"
                    >
                      <ChefHat className="h-4 w-4" />
                      {SIGUIENTE_ESTADO[p.estado]}
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
                      onClick={() =>
                        setProductos((prev) =>
                          prev.map((x) =>
                            x.id === prod.id ? { ...x, disponible: !x.disponible } : x,
                          ),
                        )
                      }
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
                      onClick={() =>
                        setPromos((prev) =>
                          prev.map((x) => (x.id === promo.id ? { ...x, activa: !x.activa } : x)),
                        )
                      }
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
                              onClick={() =>
                                setInventario((prev) =>
                                  prev.map((x) =>
                                    x.nombre === ins.nombre
                                      ? { ...x, stock: Math.max(0, x.stock - 1) }
                                      : x,
                                  ),
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full bg-muted text-base font-bold"
                              aria-label="Restar stock"
                            >
                              −
                            </button>
                            <span className="w-14 text-center font-bold">
                              {ins.stock} {ins.unidad}
                            </span>
                            <button
                              onClick={() =>
                                setInventario((prev) =>
                                  prev.map((x) =>
                                    x.nombre === ins.nombre ? { ...x, stock: x.stock + 1 } : x,
                                  ),
                                )
                              }
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
