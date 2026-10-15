import { apiFetch } from "./api";

export type PromocionApi = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precioPromo: number;
  tipo: "Permanente" | "Flash";
  inicio: string;
  fin: string | null;
  activa: boolean;
};

/** Módulo Promociones: vitrina pública + gestión por rol. */
export const PromocionesService = {
  async visibles(): Promise<PromocionApi[]> {
    return apiFetch<PromocionApi[]>("/promociones/visibles");
  },

  async list(): Promise<PromocionApi[]> {
    return apiFetch<PromocionApi[]>("/promociones");
  },

  async crear(input: {
    nombre: string;
    descripcion?: string;
    precioPromo: number;
    tipo: "Permanente" | "Flash";
    vigenciaHoras?: number;
  }): Promise<PromocionApi> {
    return apiFetch<PromocionApi>("/promociones", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async toggle(id: number, activa: boolean): Promise<PromocionApi> {
    return apiFetch<PromocionApi>(`/promociones/${id}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ activa }),
    });
  },

  async eliminar(id: number): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/promociones/${id}`, { method: "DELETE" });
  },
};
