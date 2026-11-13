import { apiFetch } from "./api";
import { getWorkerToken } from "@/lib/worker-token";

export type PromocionApi = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagenUrl?: string | null;
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

  async subirImagen(id: number, imagen: File): Promise<PromocionApi> {
    const body = new FormData();
    body.append("imagen", imagen);
    const base = String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
    const res = await fetch(`${base}/promociones/${id}/imagen`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getWorkerToken() ?? ""}` },
      body,
    });
    if (!res.ok) throw new Error("No se pudo subir la imagen de la promoción.");
    return res.json();
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

  /** Edita campos de una promoción existente. */
  async actualizar(
    id: number,
    patch: Partial<
      Pick<
        PromocionApi,
        | "nombre"
        | "descripcion"
        | "precioPromo"
        | "tipo"
        | "activa"
      >
    > & { vigenciaHoras?: number },
  ): Promise<PromocionApi> {
    return apiFetch<PromocionApi>(`/promociones/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
};
