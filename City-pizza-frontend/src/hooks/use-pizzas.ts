import { CATEGORIAS, LOCAL, PRODUCTOS, soles } from "@/lib/pizzas";

// TODO(Fase B): reemplazar mock por
//   useQuery({ queryKey: ["pizzas"], queryFn: CatalogoService.list })
// y mapear PizzaApi -> Producto (precios por tamaño).
export function usePizzas() {
  return { productos: PRODUCTOS, categorias: CATEGORIAS, local: LOCAL, loading: false as const };
}

export { soles };
