import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { PRODUCTOS, soles, type Producto } from "@/lib/pizzas";
import {
  SIGUIENTE_ESTADO_VISTA,
  type InsumoVista,
  type PromoVista,
  type PedidoVista,
  type TabAdmin,
} from "@/types/admin";

const PEDIDOS_INICIALES: PedidoVista[] = [
  { id: "#0127", cliente: "Rosa Quispe", celular: "987 654 321", items: "1× Hawaiana Familiar, 1× Gaseosa 1L", total: 45, estado: "Recibido", entrega: "Delivery", hora: "20:31" },
  { id: "#0126", cliente: "Carlos Mendoza", celular: "912 345 678", items: "2× Pepperoni Personal", total: 38, estado: "En cocina", entrega: "Recojo", hora: "20:24" },
  { id: "#0125", cliente: "María Torres", celular: "999 111 222", items: "1× Americana Familiar, 1× Cuatro Quesos Personal", total: 59, estado: "En camino", entrega: "Delivery", hora: "20:10" },
  { id: "#0124", cliente: "Jorge Huamán", celular: "955 444 333", items: "1× Familiar Carnes", total: 42, estado: "Entregado", entrega: "Delivery", hora: "19:48" },
  { id: "#0123", cliente: "Ana Flores", celular: "933 222 111", items: "1× Vegetariana Familiar, 2× Gaseosa Personal", total: 42, estado: "Entregado", entrega: "Recojo", hora: "19:30" },
];

const INVENTARIO_INICIAL: InsumoVista[] = [
  { nombre: "Queso mozzarella", stock: 2, minimo: 5, unidad: "kg" },
  { nombre: "Pepperoni", stock: 8, minimo: 3, unidad: "kg" },
  { nombre: "Jamón", stock: 6, minimo: 3, unidad: "kg" },
  { nombre: "Piña en trozos", stock: 4, minimo: 2, unidad: "kg" },
  { nombre: "Masa premezcla", stock: 30, minimo: 10, unidad: "unds" },
  { nombre: "Salsa de tomate", stock: 7, minimo: 4, unidad: "L" },
  { nombre: "Gaseosa 1L", stock: 18, minimo: 6, unidad: "unds" },
];

const PROMOS_INICIALES: PromoVista[] = [
  { id: "p1", titulo: "2×1 Martes", detalle: "2 pizzas familiares clásicas por S/58", activa: true },
  { id: "p2", titulo: "Combo Familiar", detalle: "Familiar + Gaseosa 1L por S/45", activa: true },
  { id: "p3", titulo: "Personal + Gaseosa", detalle: "Pizza personal + gaseosa 500ml por S/20", activa: false },
];

// Lógica del dashboard admin extraída de app/(interno)/admin/page.tsx (mock).
// TODO(Fase 3): GET /pedidos, /pizzas, /promociones, /inventario, /reportes/resumen.
export function useAdminDashboard() {
  const [tab, setTab] = useState<TabAdmin>("pedidos");
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS);
  const [promos, setPromos] = useState(PROMOS_INICIALES);
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [promoAEliminar, setPromoAEliminar] = useState<{ id: string; titulo: string } | null>(null);

  function avanzarPedido(id: string) {
    setPedidos((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, estado: SIGUIENTE_ESTADO_VISTA[x.estado]! } : x,
      ),
    );
  }

  function toggleDisponible(id: string) {
    setProductos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, disponible: !x.disponible } : x)),
    );
  }

  function togglePromo(id: string) {
    setPromos((prev) =>
      prev.map((x) => (x.id === id ? { ...x, activa: !x.activa } : x)),
    );
  }

  function confirmarEliminarPromo() {
    if (!promoAEliminar) return;
    setPromos((prev) => prev.filter((x) => x.id !== promoAEliminar.id));
    setPromoAEliminar(null);
  }

  function ajustarStock(nombre: string, delta: number) {
    setInventario((prev) =>
      prev.map((x) =>
        x.nombre === nombre ? { ...x, stock: Math.max(0, x.stock + delta) } : x,
      ),
    );
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

  return {
    tab, setTab,
    pedidos, avanzarPedido,
    productos, toggleDisponible,
    promos, togglePromo, promoAEliminar, setPromoAEliminar, confirmarEliminarPromo,
    inventario, ajustarStock, alertas,
    activos, ventasHoy, kpis,
    siguienteEstado: SIGUIENTE_ESTADO_VISTA,
  };
}
