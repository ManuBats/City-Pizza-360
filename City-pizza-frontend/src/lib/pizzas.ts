// Tipos y utilidades de la carta. El catálogo real viene de GET /pizzas
// (módulo Catálogo); no hay productos hardcodeados en el frontend.

export type Categoria = (typeof CATEGORIAS)[number];

export type Producto = {
  id: number;
  nombre: string;
  ingredientes: string;
  categoria: Categoria;
  precioPersonal: number;
  precioMediana: number;
  precioFamiliar: number;
  imagen: string;
  disponible: boolean;
  top?: boolean;
  destacada?: boolean;
};

/** Slug estable para matchear carrito histórico ("hawaiana") con IDs reales. */
export function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Resuelve un productoId del carrito (número o slug) contra el catálogo. */
export function resolverProducto(
  productos: Producto[],
  productoId: number | string,
): Producto | undefined {
  if (typeof productoId === "number" || /^\d+$/.test(String(productoId))) {
    const porId = productos.find((p) => p.id === Number(productoId));
    if (porId) return porId;
  }
  return productos.find((p) => slugify(p.nombre) === slugify(String(productoId)));
}

export const CATEGORIAS = ["Clásicas", "Especiales", "Supremas", "Acompañantes", "Otros platos", "Bebidas"] as const;

export function tieneTamanoDePizza(categoria: Categoria): boolean {
  return !["Bebidas", "Acompañantes", "Otros platos"].includes(categoria);
}

export const LOCAL = {
  nombre: "City Pizza Center",
  direccion: "Av. Mariscal Benavides 338, San Vicente de Cañete",
  telefono: "995 312 255",
  horario: "Mar–Dom · 2:30 pm – 11:00 pm",
  mapsQuery: "Av. Mariscal Benavides 338, San Vicente de Cañete, Perú",
};

export const COSTO_DELIVERY = 5;

export function soles(n: number): string {
  return `S/${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
