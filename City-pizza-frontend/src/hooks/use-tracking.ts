import { useQuery } from "@tanstack/react-query";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";
import type { EstadoPedido } from "@/types/pedido";

const ULTIMO_PEDIDO_KEY = "citypizza360-ultimo-pedido";

export type ReferenciaPedido = { codigo: string; celular: string };

/** Guarda el último pedido en el dispositivo para sobrevivir recargas. */
export function guardarUltimoPedido(codigo: string, celular: string) {
  try {
    window.localStorage.setItem(ULTIMO_PEDIDO_KEY, JSON.stringify({ codigo, celular }));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Lee el último pedido guardado (o null si nunca se pidió aquí). */
export function leerUltimoPedido(): ReferenciaPedido | null {
  try {
    const raw = window.localStorage.getItem(ULTIMO_PEDIDO_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ReferenciaPedido;
    if (!data.codigo || !data.celular) return null;
    return data;
  } catch {
    return null;
  }
}

const PASO_POR_ESTADO: Record<EstadoPedido, number> = {
  Recibido: 0,
  Preparacion: 2,
  Listo: 3,
  EnCamino: 4,
  Entregado: 5,
};

/** Tracking real por código + celular, polling 10s. */
export function useTrackingReal(codigo?: string, celular?: string) {
  const consulta = useQuery({
    queryKey: ["tracking", codigo, celular],
    queryFn: () => PedidosService.tracking(codigo!, celular!),
    enabled: Boolean(codigo && celular),
    refetchInterval: 10_000,
    retry: false,
  });

  return {
    pedido: consulta.data ?? null,
    pasoActual: consulta.data ? (PASO_POR_ESTADO[consulta.data.estado] ?? 0) : 0,
    cargando: consulta.isLoading,
    error: consulta.error ? getErrorMessage(consulta.error, "No encontramos ese pedido.") : null,
    buscar: Boolean(codigo && celular),
  };
}
