import { apiFetch } from "./api";
import type { Pedido } from "@/types/pedido";

export type InsumoApi = {
  id: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
};

export type ResumenApi = {
  pedidosHoy: number;
  enCurso: number;
  ventasHoy: number;
  alertasStock: number;
};

export type VentaDiaApi = {
  fecha: string;
  pedidos: number;
  ventas: number;
};

export type TopProductoApi = {
  pizzaId: number;
  nombre: string;
  cantidad: number;
};

export type RangoReporte = {
  desde?: string;
  hasta?: string;
};

function querystring(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") search.set(clave, String(valor));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Módulo Cocina: cola KDS + asignación de repartidor. */
export const CocinaService = {
  async cola(): Promise<Pedido[]> {
    return apiFetch<Pedido[]>("/cocina/cola");
  },

  async repartidores(): Promise<{ id: number; usuario: string; nombre: string; activas: number }[]> {
    return apiFetch<{ id: number; usuario: string; nombre: string; activas: number }[]>(
      "/trabajadores/repartidores",
    );
  },
};

/** Módulo Inventario: stock + alertas. */
export const InventarioService = {
  async list(): Promise<InsumoApi[]> {
    return apiFetch<InsumoApi[]>("/inventario");
  },

  async alertas(): Promise<InsumoApi[]> {
    return apiFetch<InsumoApi[]>("/inventario/alertas");
  },

  async ajustar(id: number, delta: number): Promise<InsumoApi> {
    return apiFetch<InsumoApi>(`/inventario/${id}/ajustar`, {
      method: "PATCH",
      body: JSON.stringify({ delta }),
    });
  },

  async crear(input: {
    nombre: string;
    stock?: number;
    stockMinimo?: number;
    unidad?: string;
  }): Promise<InsumoApi> {
    return apiFetch<InsumoApi>("/inventario", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async eliminar(id: number): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/inventario/${id}`, { method: "DELETE" });
  },
};

/** Módulo Reportes: dashboard y ventas por rango de fechas (solo admin). */
export const ReportesService = {
  async resumen(): Promise<ResumenApi> {
    return apiFetch<ResumenApi>("/reportes/resumen");
  },

  async ventasPorDia(params: RangoReporte = {}): Promise<VentaDiaApi[]> {
    return apiFetch<VentaDiaApi[]>(
      `/reportes/ventas-por-dia${querystring(params)}`,
    );
  },

  async topProductos(
    params: RangoReporte & { limit?: number } = {},
  ): Promise<TopProductoApi[]> {
    return apiFetch<TopProductoApi[]>(
      `/reportes/top-productos${querystring(params)}`,
    );
  },
};
