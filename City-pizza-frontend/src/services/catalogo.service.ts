import { apiFetch } from "./api";
import type { PizzaApi } from "@/types/pizza";

type PizzaRaw = Omit<PizzaApi, "precio"> & { precio: number | string };

/** Módulo Catálogo: GET /pizzas + toggle Disponible/Agotado. */
export const CatalogoService = {
  async list(): Promise<PizzaApi[]> {
    const data = await apiFetch<PizzaRaw[]>("/pizzas");
    return data.map((p) => ({ ...p, precio: Number(p.precio) }));
  },

  async setDisponibilidad(id: number, disponible: boolean): Promise<PizzaApi> {
    const data = await apiFetch<PizzaRaw>(`/pizzas/${id}/disponibilidad`, {
      method: "PATCH",
      body: JSON.stringify({ disponible }),
    });
    return { ...data, precio: Number(data.precio) };
  },
};
