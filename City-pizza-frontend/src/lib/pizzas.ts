// Adaptado de Lovable src/lib/pizzas.ts
// Imágenes: placeholders locales en public/images (se reemplazan por las
// fotos reales de Lovable cuando las pegues). Datos listos para rewiring a
// GET /pizzas del backend (módulo Catálogo).

export type Categoria = "Clásicas" | "Especiales" | "Familiares" | "Bebidas";

export type Producto = {
  id: string;
  nombre: string;
  ingredientes: string;
  categoria: Categoria;
  precioPersonal: number;
  precioFamiliar: number;
  imagen: string;
  disponible: boolean;
  top?: boolean;
};

export const CATEGORIAS: Categoria[] = ["Clásicas", "Especiales", "Familiares", "Bebidas"];

const IMG = {
  hawaiana: "/images/pizza-hawaiana.png",
  americana: "/images/pizza-americana.png",
  pepperoni: "/images/pizza-pepperoni.png",
};

export const PRODUCTOS: Producto[] = [
  {
    id: "hawaiana",
    nombre: "Hawaiana",
    ingredientes: "Queso mozzarella, jamón, piña en trozos",
    categoria: "Clásicas",
    precioPersonal: 18,
    precioFamiliar: 32,
    imagen: IMG.hawaiana,
    disponible: true,
    top: true,
  },
  {
    id: "americana",
    nombre: "Americana",
    ingredientes: "Queso mozzarella, salame, tocino, jamón",
    categoria: "Clásicas",
    precioPersonal: 18,
    precioFamiliar: 32,
    imagen: IMG.americana,
    disponible: true,
    top: true,
  },
  {
    id: "pepperoni",
    nombre: "Pepperoni",
    ingredientes: "Queso mozzarella, doble pepperoni",
    categoria: "Clásicas",
    precioPersonal: 19,
    precioFamiliar: 34,
    imagen: IMG.pepperoni,
    disponible: true,
    top: true,
  },
  {
    id: "suprema",
    nombre: "Suprema",
    ingredientes: "Queso, pepperoni, jamón, tocino, aceitunas",
    categoria: "Clásicas",
    precioPersonal: 20,
    precioFamiliar: 36,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: "bbq-chicken",
    nombre: "BBQ Chicken",
    ingredientes: "Pollo a la brasa, salsa BBQ, cebolla caramelizada",
    categoria: "Especiales",
    precioPersonal: 22,
    precioFamiliar: 38,
    imagen: IMG.pepperoni,
    disponible: true,
  },
  {
    id: "cuatro-quesos",
    nombre: "Cuatro Quesos",
    ingredientes: "Mozzarella, parmesano, gorgonzola, provolone",
    categoria: "Especiales",
    precioPersonal: 22,
    precioFamiliar: 38,
    imagen: IMG.hawaiana,
    disponible: true,
  },
  {
    id: "vegetariana",
    nombre: "Vegetariana",
    ingredientes: "Champiñones, pimientos, cebolla, aceitunas, tomate",
    categoria: "Especiales",
    precioPersonal: 19,
    precioFamiliar: 34,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: "familiar-carnes",
    nombre: "Familiar Carnes",
    ingredientes: "Pepperoni, salame, tocino, jamón, chorizo",
    categoria: "Familiares",
    precioPersonal: 24,
    precioFamiliar: 42,
    imagen: IMG.pepperoni,
    disponible: true,
  },
  {
    id: "familiar-cantina",
    nombre: "Familiar La Cantina",
    ingredientes: "Doble queso, doble pepperoni, orégano especial",
    categoria: "Familiares",
    precioPersonal: 23,
    precioFamiliar: 40,
    imagen: IMG.americana,
    disponible: true,
  },
  {
    id: "gaseosa-1l",
    nombre: "Gaseosa 1L",
    ingredientes: "Inca Kola, Coca Cola o Sprite",
    categoria: "Bebidas",
    precioPersonal: 8,
    precioFamiliar: 8,
    imagen: IMG.hawaiana,
    disponible: true,
  },
  {
    id: "gaseosa-personal",
    nombre: "Gaseosa Personal",
    ingredientes: "Botella 500ml, variedad de sabores",
    categoria: "Bebidas",
    precioPersonal: 4,
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
