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

/** Módulo Reportes: dashboard básico (solo admin). */
export const ReportesService = {
  async resumen(): Promise<ResumenApi> {
    return apiFetch<ResumenApi>("/reportes/resumen");
  },
};
