import { apiFetch } from "./api";
import { getWorkerToken } from "@/lib/worker-token";
import type { PizzaApi } from "@/types/pizza";

type PizzaRaw = Omit<
  PizzaApi,
  "precio" | "precioPersonal" | "precioMediana" | "precioFamiliar"
> & {
  precio: number | string;
  precioPersonal: number | string;
  precioMediana: number | string;
  precioFamiliar: number | string;
};

function normalizar(p: PizzaRaw): PizzaApi {
  return {
    ...p,
    precio: Number(p.precio),
    precioPersonal: Number(p.precioPersonal),
    precioMediana: Number(p.precioMediana),
    precioFamiliar: Number(p.precioFamiliar),
  };
}

/** Módulo Catálogo: GET /pizzas + toggle Disponible/Agotado. */
export const CatalogoService = {
  async list(): Promise<PizzaApi[]> {
    const data = await apiFetch<PizzaRaw[]>("/pizzas");
    return data.map(normalizar);
  },

  async setDisponibilidad(id: number, disponible: boolean): Promise<PizzaApi> {
    const data = await apiFetch<PizzaRaw>(`/pizzas/${id}/disponibilidad`, {
      method: "PATCH",
      body: JSON.stringify({ disponible }),
    });
    return normalizar(data);
  },

  async crear(input: {
    nombre: string;
    tipo?: string;
    categoria?: string;
    precioPersonal: number;
    precioMediana: number;
    precioFamiliar: number;
  }): Promise<PizzaApi> {
    const data = await apiFetch<PizzaRaw>("/pizzas", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizar(data);
  },

  async subirImagen(id: number, archivo: File): Promise<PizzaApi> {
    const form = new FormData();
    form.append("imagen", archivo);
    const base = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");
    const token = getWorkerToken();
    const res = await fetch(`${base}/pizzas/${id}/imagen`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error("No se pudo subir la imagen");
    return normalizar((await res.json()) as PizzaRaw);
  },

  async eliminar(id: number): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/pizzas/${id}`, { method: "DELETE" });
  },
};
