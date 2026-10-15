import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PedidosService } from "@/services/pedidos.service";
import { CatalogoService } from "@/services/catalogo.service";
import { PromocionesService } from "@/services/promociones.service";
import { usePizzas } from "@/hooks/use-pizzas";
import { getErrorMessage } from "@/services/api";
import type { EstadoPedido } from "@/types/pedido";

export type TabCajero = "pedidos" | "carta" | "promo";

const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
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

export function etiquetaEstado(e: EstadoPedido): string {
  return ETIQUETA_ESTADO[e];
}

// Caja real: pedidos + carta + promo flash contra el backend.
export function useCajero() {
  const queryClient = useQueryClient();
  const { productos, loading: cargandoCarta } = usePizzas();
  const [tab, setTab] = useState<TabCajero>("pedidos");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [precio, setPrecio] = useState(38);
  const [horas, setHoras] = useState(24);
  const [errorPromo, setErrorPromo] = useState<string | null>(null);

  const pedidosQ = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => PedidosService.list(),
    refetchInterval: 10_000,
  });

  const promosQ = useQuery({
    queryKey: ["promos-turno"],
    queryFn: () => PromocionesService.list(),
  });

  async function recargarPedidos() {
    await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
  }

  const avanzar = useMutation({
    mutationFn: ({ id, a }: { id: number; a: EstadoPedido }) =>
      PedidosService.cambiarEstado(id, a),
    onSuccess: () => void recargarPedidos(),
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo avanzar el pedido.")),
  });

  const toggleCarta = useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) =>
      CatalogoService.setDisponibilidad(id, disponible),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pizzas"] });
      toast.success("Disponibilidad actualizada");
    },
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo actualizar.")),
  });

  const crearPromo = useMutation({
    mutationFn: () =>
      PromocionesService.crear({
        nombre: titulo.trim(),
        descripcion: detalle.trim() || undefined,
        precioPromo: precio,
        tipo: "Flash",
        vigenciaHoras: horas,
      }),
    onSuccess: () => {
      setErrorPromo(null);
      setTitulo("");
      setDetalle("");
      setPrecio(38);
      setHoras(24);
      toast.success("Promo flash publicada");
      void queryClient.invalidateQueries({ queryKey: ["promos-turno"] });
    },
    onError: (e) => setErrorPromo(getErrorMessage(e, "No se pudo publicar la promo.")),
  });

  function onCrearPromo(e: React.FormEvent<HTMLFormElement>) {
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
    crearPromo.mutate();
  }

  const pedidos = (pedidosQ.data ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    cliente: `${p.nombres} ${p.apellidos}`,
    items: p.detalles.map((d) => `${d.cantidad}× ${d.pizza.nombre} (${d.tamano})`).join(", "),
    total: Number(p.total),
    estado: p.estado,
    etiqueta: etiquetaEstado(p.estado),
    siguiente: SIGUIENTE[p.estado],
    entrega: p.tipoEntrega,
    hora: new Date(p.creadoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
  }));

  return {
    tab, setTab,
    pedidos, cargandoPedidos: pedidosQ.isLoading,
    errorPedidos: pedidosQ.error ? getErrorMessage(pedidosQ.error, "No se pudieron cargar los pedidos.") : null,
    reintentarPedidos: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
    avanzarPedido: (id: number, a: EstadoPedido) => avanzar.mutate({ id, a }),
    productos, cargandoCarta, toggleDisponible: (id: number, disponible: boolean) =>
      toggleCarta.mutate({ id, disponible }),
    promos: promosQ.data ?? [],
    titulo, setTitulo, detalle, setDetalle, precio, setPrecio, horas, setHoras,
    errorPromo, crearPromo: onCrearPromo, publicando: crearPromo.isPending,
  };
}
