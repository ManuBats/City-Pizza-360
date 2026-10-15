import { useQuery } from "@tanstack/react-query";
import { CatalogoService } from "@/services/catalogo.service";
import {
  CATEGORIAS,
  LOCAL,
  PRODUCTOS,
  slugify,
  soles,
  type Categoria,
  type Producto,
} from "@/lib/pizzas";
import type { PizzaApi } from "@/types/pizza";

const TOP_SLUGS = ["hawaiana", "americana", "pepperoni"];

const IMAGEN_POR_SLUG: Record<string, string> = {
  hawaiana: "/images/pizza-hawaiana.png",
  americana: "/images/pizza-americana.png",
  pepperoni: "/images/pizza-pepperoni.png",
};

const IMAGEN_GENERICA = "/images/pizza-pepperoni.png";

function mapear(p: PizzaApi): Producto {
  const slug = slugify(p.nombre);
  return {
    id: p.id,
    nombre: p.nombre,
    ingredientes: p.descripcion || "Pizza artesanal de City Pizza Center",
    categoria: (p.categoria || "Clásicas") as Categoria,
    precioPersonal: Number(p.precioPersonal),
    precioMediana: Number(p.precioMediana),
    precioFamiliar: Number(p.precioFamiliar),
    imagen: p.imagenUrl || IMAGEN_POR_SLUG[slug] || IMAGEN_GENERICA,
    disponible: p.disponible,
    top: TOP_SLUGS.includes(slug),
  };
}

/** Catálogo real contra GET /pizzas (con fallback al mock si el backend no responde). */
export function usePizzas() {
  const consulta = useQuery({
    queryKey: ["pizzas"],
    queryFn: () => CatalogoService.list(),
    staleTime: 60_000,
    retry: 1,
  });

  const productos: Producto[] = consulta.data
    ? consulta.data.map(mapear)
    : PRODUCTOS;

  return {
    productos,
    categorias: CATEGORIAS,
    local: LOCAL,
    loading: consulta.isLoading,
    enVivo: Boolean(consulta.data),
  };
}

export { soles };
