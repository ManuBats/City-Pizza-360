import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";
import type { EstadoPedido } from "@/types/pedido";

/** Mock temporal cuando se entra a /tracking sin código (demo visual). */
export function useTrackingSimulado() {
  const [pasoActual, setPasoActual] = useState(2);
  useEffect(() => {
    const t = setInterval(() => {
      setPasoActual((p) => Math.min(p + 1, 5));
    }, 15000);
    return () => clearInterval(t);
  }, []);
  return { pasoActual, totalPasos: 6 };
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
