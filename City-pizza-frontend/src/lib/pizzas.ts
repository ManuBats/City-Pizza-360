// Adaptado de Lovable src/lib/pizzas.ts
// Imágenes: placeholders locales en public/images (se reemplazan por las
// fotos reales de Lovable cuando las pegues). Datos listos para rewiring a
// GET /pizzas del backend (módulo Catálogo).

export type Categoria = "Clásicas" | "Especiales" | "Familiares" | "Bebidas";

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

export const CATEGORIAS: Categoria[] = ["Clásicas", "Especiales", "Familiares", "Bebidas"];

const IMG = {
  hawaiana: "/images/pizza-hawaiana.png",
  americana: "/images/pizza-americana.png",
  pepperoni: "/images/pizza-pepperoni.png",
};

export const PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: "Hawaiana",
    ingredientes: "Queso mozzarella, jamón, piña en trozos",
    categoria: "Clásicas",
    precioPersonal: 18,
    precioMediana: 25,
    precioFamiliar: 32,
    imagen: IMG.hawaiana,
    disponible: true,
    top: true,
  },
  {
    id: 2,
    nombre: "Americana",
    ingredientes: "Queso mozzarella, salame, tocino, jamón",
    categoria: "Clásicas",
    precioPersonal: 18,
    precioMediana: 25,
    precioFamiliar: 32,
    imagen: IMG.americana,
    disponible: true,
    top: true,
  },
  {
    id: 3,
    nombre: "Pepperoni",
    ingredientes: "Queso mozzarella, doble pepperoni",
    categoria: "Clásicas",
    precioPersonal: 19,
    precioMediana: 26,
    precioFamiliar: 34,
    imagen: IMG.pepperoni,
    disponible: true,
    top: true,
  },
  {
    id: 4,
    nombre: "Suprema",
    ingredientes: "Queso, pepperoni, jamón, tocino, aceitunas",
    categoria: "Clásicas",
    precioPersonal: 20,
    precioMediana: 28,
    precioFamiliar: 36,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: 5,
    nombre: "BBQ Chicken",
    ingredientes: "Pollo a la brasa, salsa BBQ, cebolla caramelizada",
    categoria: "Especiales",
    precioPersonal: 22,
    precioMediana: 30,
    precioFamiliar: 38,
    imagen: IMG.pepperoni,
    disponible: true,
  },
  {
    id: 6,
    nombre: "Cuatro Quesos",
    ingredientes: "Mozzarella, parmesano, gorgonzola, provolone",
    categoria: "Especiales",
    precioPersonal: 22,
    precioMediana: 30,
    precioFamiliar: 38,
    imagen: IMG.hawaiana,
    disponible: true,
  },
  {
    id: 7,
    nombre: "Vegetariana",
    ingredientes: "Champiñones, pimientos, cebolla, aceitunas, tomate",
    categoria: "Especiales",
    precioPersonal: 19,
    precioMediana: 26,
    precioFamiliar: 34,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: 8,
    nombre: "Familiar Carnes",
    ingredientes: "Pepperoni, salame, tocino, jamón, chorizo",
    categoria: "Familiares",
    precioPersonal: 24,
    precioMediana: 33,
    precioFamiliar: 42,
    imagen: IMG.pepperoni,
    disponible: true,
  },
  {
    id: 9,
    nombre: "Familiar La Cantina",
    ingredientes: "Doble queso, doble pepperoni, orégano especial",
    categoria: "Familiares",
    precioPersonal: 23,
    precioMediana: 31,
    precioFamiliar: 40,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: 10,
    nombre: "Gaseosa 1L",
    ingredientes: "Inca Kola, Coca Cola o Sprite",
    categoria: "Bebidas",
    precioPersonal: 8,
    precioMediana: 8,
    precioFamiliar: 8,
    imagen: IMG.hawaiana,
    disponible: true,
  },
  {
    id: 11,
    nombre: "Gaseosa Personal",
    ingredientes: "Botella 500ml, variedad de sabores",
    categoria: "Bebidas",
    precioPersonal: 4,
    precioMediana: 4,
    precioFamiliar: 4,
    imagen: IMG.pepperoni,
    disponible: true,
  },
];

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
