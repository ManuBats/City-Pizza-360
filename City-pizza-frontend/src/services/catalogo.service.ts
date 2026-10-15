import { apiFetch } from "./api";
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
};
