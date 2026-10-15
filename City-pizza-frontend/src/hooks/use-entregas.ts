import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";

export type Entrega = {
  id: number;
  codigo: string;
  cliente: string;
  celular: string;
  direccion: string;
  referencia?: string;
  resumen: string;
  estado: "pendiente" | "en-camino" | "entregado";
};

export function mapsUrl(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Perú")}`;
}

// Mis entregas reales: GET /pedidos/mis-entregas + avance de estado.
export function useEntregas() {
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ["mis-entregas"],
    queryFn: () => PedidosService.misEntregas(),
    refetchInterval: 10_000,
  });

  async function recargar() {
    await queryClient.invalidateQueries({ queryKey: ["mis-entregas"] });
  }

  const avanzar = useMutation({
    mutationFn: ({ id, a }: { id: number; a: "EnCamino" | "Entregado" }) =>
      PedidosService.cambiarEstado(id, a),
    onSuccess: () => void recargar(),
    onError: (e) => toast.error(getErrorMessage(e, "No se pudo actualizar la entrega.")),
  });

  const entregas: Entrega[] = (consulta.data ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    cliente: `${p.nombres} ${p.apellidos}`,
    celular: p.celular,
    direccion: p.direccion,
    referencia: p.referencia ?? undefined,
    resumen: p.detalles.map((d) => `${d.cantidad}× ${d.pizza.nombre} (${d.tamano})`).join(" + "),
    estado: p.estado === "EnCamino" ? "en-camino" : "pendiente",
  }));

  return {
    activas: entregas,
    cargando: consulta.isLoading,
    errorEntregas: consulta.error ? getErrorMessage(consulta.error, "No se pudieron cargar las entregas.") : null,
    reintentar: recargar,
    avanzar: (id: number, actual: Entrega["estado"]) =>
      avanzar.mutate({ id, a: actual === "pendiente" ? "EnCamino" : "Entregado" }),
  };
}
