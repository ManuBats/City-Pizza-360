import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CocinaService } from "@/services/operacion.service";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";

export type Repartidor = { id: number; usuario: string; nombre: string };

export type TicketKds = {
  id: number;
  codigo: string;
  cliente: string;
  entrega: "Delivery" | "Recojo" | "Mesa";
  recibidoEn: number;
  estado: "nuevo" | "preparando";
  yapePendiente: boolean;
  repartidorId: number | null;
  items: { qty: number; nombre: string; nota?: string }[];
};

// Cola KDS real: GET /cocina/cola cada 3s + avance + asignación.
export function useCola() {
  const queryClient = useQueryClient();

  const cola = useQuery({
    queryKey: ["cocina-cola"],
    queryFn: () => CocinaService.cola(),
    refetchInterval: 3_000,
  });

  const equipo = useQuery({
    queryKey: ["repartidores"],
    queryFn: () => CocinaService.repartidores(),
    staleTime: 60_000,
  });  async function recargar() {
    await queryClient.invalidateQueries({ queryKey: ["cocina-cola"] });
  }

  const avanzar = useMutation({
    mutationFn: ({ id, a }: { id: number; a: "Preparacion" | "Listo" }) =>
      PedidosService.cambiarEstado(id, a),
    onSuccess: () => void recargar(),
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo avanzar el pedido.")),
  });

  const asignar = useMutation({
    mutationFn: ({ id, repartidorId }: { id: number; repartidorId: number }) =>
      PedidosService.asignarRepartidor(id, repartidorId),
    onSuccess: () => {
      toast.success("Repartidor asignado");
      void recargar();
    },
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo asignar.")),
  });

  const tickets: TicketKds[] = (cola.data ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    cliente: `${p.nombres} ${p.apellidos}`,
    entrega: (p.tipoEntrega === "Mesa" ? "Mesa" : p.tipoEntrega) as TicketKds["entrega"],
    recibidoEn: new Date(p.creadoEn).getTime(),
    estado: p.estado === "Recibido" ? "nuevo" : "preparando",
    yapePendiente: p.metodoPago === "Yape" && p.estadoPago === "Pendiente",
    repartidorId: p.repartidorId,
    items: p.detalles.map((d) => ({
      qty: d.cantidad,
      nombre: `${d.pizza.nombre} ${d.tamano}${d.extraQueso ? " +queso" : ""}`,
      nota: d.nota ?? undefined,
    })),
  }));

  return {
    tickets,
    ahora: Date.now(),
    nuevos: tickets.filter((t) => t.estado === "nuevo"),
    preparando: tickets.filter((t) => t.estado === "preparando"),
    cargando: cola.isLoading,
    errorCola: cola.error ? getErrorMessage(cola.error, "No se pudo cargar la cola.") : null,
    reintentar: recargar,
    repartidores: (equipo.data ?? []) as Repartidor[],
    iniciar: (id: number) => avanzar.mutate({ id, a: "Preparacion" }),
    marcarListo: (id: number) => avanzar.mutate({ id, a: "Listo" }),
    asignar: (id: number, repartidorId: number) => asignar.mutate({ id, repartidorId }),
  };
}

export function minutosDesde(ts: number, ahora: number) {
  return Math.max(0, Math.floor((ahora - ts) / 60_000));
}
