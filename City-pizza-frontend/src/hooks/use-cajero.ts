import { useState } from "react";
import { PRODUCTOS, type Producto } from "@/lib/pizzas";
import {
  SIGUIENTE_ESTADO_VISTA,
  type PedidoVista,
} from "@/types/admin";

const PEDIDOS_INICIALES: PedidoVista[] = [
  { id: "#0127", cliente: "Rosa Quispe", items: "1× Hawaiana Familiar, 1× Gaseosa 1L", total: 45, estado: "Recibido", entrega: "Delivery", hora: "20:31" },
  { id: "#0126", cliente: "Carlos Mendoza", items: "2× Pepperoni Personal", total: 38, estado: "En cocina", entrega: "Recojo", hora: "20:24" },
  { id: "#0125", cliente: "María Torres", items: "1× Americana Familiar, 1× Cuatro Quesos Personal", total: 59, estado: "En camino", entrega: "Delivery", hora: "20:10" },
];

export type TabCajero = "pedidos" | "carta" | "promo";

export type PromoFlash = { id: string; titulo: string; detalle: string; venceEn: number };

// Lógica de caja extraída de app/(interno)/cajero/page.tsx (mock).
// TODO(Fase 3): GET /pedidos + PATCH estado/disponibilidad + POST /promociones.
export function useCajero() {
  const [tab, setTab] = useState<TabCajero>("pedidos");
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS);
  const [promos, setPromos] = useState<PromoFlash[]>([]);
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [horas, setHoras] = useState(24);
  const [errorPromo, setErrorPromo] = useState<string | null>(null);

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

  function crearPromo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (horas > 48) {
      setErrorPromo("Las promos de caja duran máximo 48 horas.");
      return;
    }
    if (horas < 1) {
      setErrorPromo("La promo debe durar al menos 1 hora.");
      return;
    }
    if (!titulo.trim() || !detalle.trim()) {
      setErrorPromo("Completa título y detalle.");
      return;
    }
    setErrorPromo(null);
    setPromos((prev) => [
      {
        id: `pf-${Date.now()}`,
        titulo: titulo.trim(),
        detalle: detalle.trim(),
        venceEn: Date.now() + horas * 60 * 60 * 1000,
      },
      ...prev,
    ]);
    setTitulo("");
    setDetalle("");
    setHoras(24);
  }

  return {
    tab, setTab,
    pedidos, avanzarPedido,
    productos, toggleDisponible,
    promos,
    titulo, setTitulo, detalle, setDetalle, horas, setHoras,
    errorPromo, crearPromo,
    siguienteEstado: SIGUIENTE_ESTADO_VISTA,
  };
}
