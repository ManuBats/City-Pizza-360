import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { PedidosService } from "@/services/pedidos.service";
import { CatalogoService } from "@/services/catalogo.service";
import { PromocionesService } from "@/services/promociones.service";
import { InventarioService, ReportesService } from "@/services/operacion.service";
import { usePizzas } from "@/hooks/use-pizzas";
import { getErrorMessage } from "@/services/api";
import type { EstadoPedido } from "@/types/pedido";
import type { TabAdmin } from "@/types/admin";

const ETIQUETA: Record<EstadoPedido, string> = {
  Recibido: "Recibido",
  Preparacion: "En cocina",
  Listo: "Listo",
  EnCamino: "En camino",
  Entregado: "Entregado",
};

const SIGUIENTE: Record<EstadoPedido, EstadoPedido | null> = {
  Recibido: "Preparacion",
  Preparacion: "Listo",
  Listo: "EnCamino",
  EnCamino: "Entregado",
  Entregado: null,
};

export function etiquetaEstadoAdmin(e: EstadoPedido): string {
  return ETIQUETA[e];
}

// Dashboard admin real contra el backend.
export function useAdminDashboard() {
  const queryClient = useQueryClient();
  const { productos, loading: cargandoCarta } = usePizzas();
  const [tab, setTab] = useState<TabAdmin>("pedidos");
  const [eliminarTarget, setEliminarTarget] = useState<
    { tipo: "promo" | "producto" | "insumo"; id: number; nombre: string } | null
  >(null);

  // Formularios inline
  const [promoNombre, setPromoNombre] = useState("");
  const [promoDetalle, setPromoDetalle] = useState("");
  const [promoPrecio, setPromoPrecio] = useState(45);
  const [promoHoras, setPromoHoras] = useState(0);
  const [prodNombre, setProdNombre] = useState("");
  const [prodTipo, setProdTipo] = useState("Pizza");
  const [prodCategoria, setProdCategoria] = useState("Clásicas");
  const [prodPersonal, setProdPersonal] = useState(18);
  const [prodMediana, setProdMediana] = useState(25);
  const [prodFamiliar, setProdFamiliar] = useState(32);
  const [prodImagen, setProdImagen] = useState<File | null>(null);
  const [insNombre, setInsNombre] = useState("");
  const [insStock, setInsStock] = useState(0);
  const [insMinimo, setInsMinimo] = useState(0);
  const [insUnidad, setInsUnidad] = useState("kg");

  const resumenQ = useQuery({
    queryKey: ["reportes-resumen"],
    queryFn: () => ReportesService.resumen(),
  });
  const pedidosQ = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => PedidosService.list(),
    refetchInterval: 10_000,
  });
  const promosQ = useQuery({
    queryKey: ["promos-admin"],
    queryFn: () => PromocionesService.list(),
  });
  const inventarioQ = useQuery({
    queryKey: ["inventario"],
    queryFn: () => InventarioService.list(),
  });

  const recargar = (key: string[]) => queryClient.invalidateQueries({ queryKey: key });
  const err = (e: unknown, fb: string) => toast.error(getErrorMessage(e, fb));

  const avanzar = useMutation({
    mutationFn: ({ id, a }: { id: number; a: EstadoPedido }) =>
      PedidosService.cambiarEstado(id, a),
    onSuccess: () => {
      void recargar(["pedidos"]);
      void recargar(["reportes-resumen"]);
    },
    onError: (e) => err(e, "No se pudo avanzar el pedido."),
  });

  const toggleCarta = useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) =>
      CatalogoService.setDisponibilidad(id, disponible),
    onSuccess: () => {
      void recargar(["pizzas"]);
      toast.success("Disponibilidad actualizada");
    },
    onError: (e) => err(e, "No se pudo actualizar."),
  });

  const toggleDestacada = useMutation({
    mutationFn: ({ id, destacada }: { id: number; destacada: boolean }) =>
      CatalogoService.actualizar(id, { destacada }),
    onSuccess: () => {
      void recargar(["pizzas"]);
      toast.success("Destacadas actualizadas");
    },
    onError: (e) => err(e, "No se pudo actualizar."),
  });

  const crearPromo = useMutation({
    mutationFn: () =>
      PromocionesService.crear({
        nombre: promoNombre.trim(),
        descripcion: promoDetalle.trim() || undefined,
        precioPromo: promoPrecio,
        tipo: "Permanente",
        vigenciaHoras: promoHoras > 0 ? promoHoras : undefined,
      }),
    onSuccess: () => {
      setPromoNombre("");
      setPromoDetalle("");
      setPromoPrecio(45);
      setPromoHoras(0);
      toast.success("Promoción creada");
      void recargar(["promos-admin"]);
    },
    onError: (e) => err(e, "No se pudo crear la promo."),
  });

  const crearProducto = useMutation({
    mutationFn: async () => {
      const p = await CatalogoService.crear({
        nombre: prodNombre.trim(),
        tipo: prodTipo.trim() || "Pizza",
        categoria: prodCategoria.trim() || "Clásicas",
        precioPersonal: prodPersonal,
        precioMediana: prodMediana,
        precioFamiliar: prodFamiliar,
      });
      if (prodImagen) await CatalogoService.subirImagen(p.id, prodImagen);
      return p;
    },
    onSuccess: () => {
      setProdNombre("");
      setProdImagen(null);
      toast.success("Producto creado");
      void recargar(["pizzas"]);
    },
    onError: (e) => err(e, "No se pudo crear el producto."),
  });

  const crearInsumo = useMutation({
    mutationFn: () =>
      InventarioService.crear({
        nombre: insNombre.trim(),
        stock: insStock,
        stockMinimo: insMinimo,
        unidad: insUnidad.trim() || "kg",
      }),
    onSuccess: () => {
      setInsNombre("");
      setInsStock(0);
      setInsMinimo(0);
      toast.success("Insumo creado");
      void recargar(["inventario"]);
    },
    onError: (e) => err(e, "No se pudo crear el insumo."),
  });

  const eliminar = useMutation({
    mutationFn: async () => {
      if (!eliminarTarget) throw new Error("Sin objetivo");
      if (eliminarTarget.tipo === "promo") return PromocionesService.eliminar(eliminarTarget.id);
      if (eliminarTarget.tipo === "producto") return CatalogoService.eliminar(eliminarTarget.id);
      return InventarioService.eliminar(eliminarTarget.id);
    },
    onSuccess: () => {
      setEliminarTarget(null);
      toast.success("Eliminado");
      void recargar(["promos-admin"]);
      void recargar(["pizzas"]);
      void recargar(["inventario"]);
    },
    onError: (e) => err(e, "No se pudo eliminar (puede tener historial)."),
  });

  const togglePromo = useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      PromocionesService.toggle(id, activa),
    onSuccess: () => void recargar(["promos-admin"]),
    onError: (e) => err(e, "No se pudo actualizar la promo."),
  });

  const ajustar = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      InventarioService.ajustar(id, delta),
    onSuccess: () => {
      void recargar(["inventario"]);
      void recargar(["reportes-resumen"]);
    },
    onError: (e) => err(e, "No se pudo ajustar el stock."),
  });

  const resumen = resumenQ.data;
  const pedidos = (pedidosQ.data ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    cliente: `${p.nombres} ${p.apellidos}${p.celular ? ` · ${p.celular}` : ""}`,
    items: p.detalles.map((d) => `${d.cantidad}× ${d.pizza.nombre} (${d.tamano})`).join(", "),
    total: Number(p.total),
    estado: p.estado,
    etiqueta: etiquetaEstadoAdmin(p.estado),
    siguiente: SIGUIENTE[p.estado],
    entrega: p.tipoEntrega,
    hora: new Date(p.creadoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
  }));

  const inventario = inventarioQ.data ?? [];
  const alertas = inventario.filter((i) => i.stock <= i.stockMinimo);

  const kpis = [
    { icon: LayoutDashboard, label: "Pedidos hoy", valor: String(resumen?.pedidosHoy ?? "…") },
    { icon: Clock, label: "En curso", valor: String(resumen?.enCurso ?? "…") },
    { icon: CheckCircle2, label: "Ventas hoy", valor: resumen ? `S/${resumen.ventasHoy}` : "…" },
    { icon: AlertTriangle, label: "Alertas stock", valor: String(resumen?.alertasStock ?? alertas.length) },
  ];

  return {
    tab, setTab,
    pedidos, cargandoPedidos: pedidosQ.isLoading,
    errorPedidos: pedidosQ.error ? getErrorMessage(pedidosQ.error, "No se pudieron cargar los pedidos.") : null,
    reintentarPedidos: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
    avanzarPedido: (id: number, a: EstadoPedido) => avanzar.mutate({ id, a }),
    productos, cargandoCarta, toggleDisponible: (id: number, disponible: boolean) =>
      toggleCarta.mutate({ id, disponible }),
    toggleDestacada: (id: number, destacada: boolean) =>
      toggleDestacada.mutate({ id, destacada }),
    crearProducto: () => crearProducto.mutate(), creandoProducto: crearProducto.isPending,
    prodNombre, setProdNombre, prodTipo, setProdTipo, prodCategoria, setProdCategoria,
    prodPersonal, setProdPersonal, prodMediana, setProdMediana, prodFamiliar, setProdFamiliar,
    prodImagen, setProdImagen,
    promos: promosQ.data ?? [],
    togglePromo: (id: number, activa: boolean) => togglePromo.mutate({ id, activa }),
    promoNombre, setPromoNombre, promoDetalle, setPromoDetalle,
    promoPrecio, setPromoPrecio, promoHoras, setPromoHoras,
    crearPromo: () => crearPromo.mutate(), creandoPromo: crearPromo.isPending,
    inventario, cargandoInventario: inventarioQ.isLoading, alertas,
    ajustar: (id: number, delta: number) => ajustar.mutate({ id, delta }),
    insNombre, setInsNombre, insStock, setInsStock, insMinimo, setInsMinimo,
    insUnidad, setInsUnidad,
    crearInsumo: () => crearInsumo.mutate(), creandoInsumo: crearInsumo.isPending,
    eliminarTarget, setEliminarTarget,
    confirmarEliminar: () => eliminar.mutate(), eliminando: eliminar.isPending,
    kpis,
    siguienteEstado: SIGUIENTE,
  };
}
