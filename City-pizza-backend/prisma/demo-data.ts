/** Datos de demostración para desarrollo. No se cargan con `prisma:seed`. */
import type { Rol } from '@prisma/client';

export const INSUMOS_DEMO = [
  { nombre: 'Queso mozzarella', stock: 2, stockMinimo: 5, unidad: 'kg' },
  { nombre: 'Pepperoni', stock: 8, stockMinimo: 3, unidad: 'kg' },
  { nombre: 'Jamón', stock: 6, stockMinimo: 3, unidad: 'kg' },
  { nombre: 'Piña en trozos', stock: 4, stockMinimo: 2, unidad: 'kg' },
  { nombre: 'Salame', stock: 5, stockMinimo: 2, unidad: 'kg' },
  { nombre: 'Tocino', stock: 5, stockMinimo: 2, unidad: 'kg' },
  { nombre: 'Pollo a la brasa', stock: 6, stockMinimo: 3, unidad: 'kg' },
  { nombre: 'Masa premezcla', stock: 30, stockMinimo: 10, unidad: 'unds' },
  { nombre: 'Salsa de tomate', stock: 7, stockMinimo: 4, unidad: 'L' },
  { nombre: 'Gaseosa 1L', stock: 18, stockMinimo: 6, unidad: 'unds' },
  { nombre: 'Gaseosa personal', stock: 24, stockMinimo: 12, unidad: 'unds' },
];

export const PIZZAS_DEMO: {
  nombre: string;
  tipo: string;
  categoria: string;
  personal: number;
  mediana: number;
  familiar: number;
  descripcion: string;
  destacada?: boolean;
  insumos: string[];
}[] = [
  {
    nombre: 'Hawaiana',
    tipo: 'Pizza',
    categoria: 'Clásicas',
    personal: 18,
    mediana: 25,
    familiar: 32,
    destacada: true,
    descripcion: 'Queso mozzarella, jamón, piña en trozos',
    insumos: ['Queso mozzarella', 'Jamón', 'Piña en trozos'],
  },
  {
    nombre: 'Americana',
    tipo: 'Pizza',
    categoria: 'Clásicas',
    personal: 18,
    mediana: 25,
    familiar: 32,
    destacada: true,
    descripcion: 'Queso mozzarella, salame, tocino, jamón',
    insumos: ['Queso mozzarella', 'Salame', 'Tocino', 'Jamón'],
  },
  {
    nombre: 'Pepperoni',
    tipo: 'Pizza',
    categoria: 'Clásicas',
    personal: 19,
    mediana: 26,
    familiar: 34,
    destacada: true,
    descripcion: 'Queso mozzarella, doble pepperoni',
    insumos: ['Queso mozzarella', 'Pepperoni'],
  },
  {
    nombre: 'Suprema',
    tipo: 'Pizza',
    categoria: 'Clásicas',
    personal: 20,
    mediana: 28,
    familiar: 36,
    descripcion: 'Queso, pepperoni, jamón, tocino, aceitunas',
    insumos: ['Queso mozzarella', 'Pepperoni', 'Jamón', 'Tocino'],
  },
  {
    nombre: 'BBQ Chicken',
    tipo: 'Pizza',
    categoria: 'Especiales',
    personal: 22,
    mediana: 30,
    familiar: 38,
    descripcion: 'Pollo a la brasa, salsa BBQ, cebolla caramelizada',
    insumos: ['Queso mozzarella', 'Pollo a la brasa'],
  },
  {
    nombre: 'Cuatro Quesos',
    tipo: 'Pizza',
    categoria: 'Especiales',
    personal: 22,
    mediana: 30,
    familiar: 38,
    descripcion: 'Mozzarella, parmesano, gorgonzola, provolone',
    insumos: ['Queso mozzarella'],
  },
  {
    nombre: 'Vegetariana',
    tipo: 'Pizza',
    categoria: 'Especiales',
    personal: 19,
    mediana: 26,
    familiar: 34,
    descripcion: 'Champiñones, pimientos, cebolla, aceitunas, tomate',
    insumos: ['Queso mozzarella', 'Salsa de tomate'],
  },
  {
    nombre: 'Familiar Carnes',
    tipo: 'Pizza',
    categoria: 'Familiares',
    personal: 24,
    mediana: 33,
    familiar: 42,
    descripcion: 'Pepperoni, salame, tocino, jamón, chorizo',
    insumos: ['Queso mozzarella', 'Pepperoni', 'Salame', 'Tocino', 'Jamón'],
  },
  {
    nombre: 'Familiar La Cantina',
    tipo: 'Pizza',
    categoria: 'Familiares',
    personal: 23,
    mediana: 31,
    familiar: 40,
    descripcion: 'Doble queso, doble pepperoni, orégano especial',
    insumos: ['Queso mozzarella', 'Pepperoni'],
  },
  {
    nombre: 'Gaseosa 1L',
    tipo: 'Bebida',
    categoria: 'Bebidas',
    personal: 8,
    mediana: 8,
    familiar: 8,
    descripcion: 'Inca Kola, Coca Cola o Sprite',
    insumos: ['Gaseosa 1L'],
  },
  {
    nombre: 'Gaseosa Personal',
    tipo: 'Bebida',
    categoria: 'Bebidas',
    personal: 4,
    mediana: 4,
    familiar: 4,
    descripcion: 'Botella 500ml, variedad de sabores',
    insumos: ['Gaseosa personal'],
  },
];

export const PROMOS_DEMO = [
  {
    nombre: '2×1 Martes',
    descripcion: '2 pizzas familiares clásicas por S/58',
    precioPromo: 58,
    tipo: 'Permanente' as const,
  },
  {
    nombre: 'Combo Familiar',
    descripcion: 'Familiar + Gaseosa 1L por S/45',
    precioPromo: 45,
    tipo: 'Permanente' as const,
  },
];

export const TRABAJADORES_DEMO: {
  usuario: string;
  nombre: string;
  rol: Rol;
  password: string;
}[] = [
  {
    usuario: 'cajero',
    nombre: 'Caja Turno Noche',
    rol: 'Cajero',
    password: 'caja123',
  },
  {
    usuario: 'cocina',
    nombre: 'Cocina Principal',
    rol: 'Cocinero',
    password: 'cocina123',
  },
  {
    usuario: 'delivery',
    nombre: 'José Ramírez',
    rol: 'Repartidor',
    password: 'moto123',
  },
  {
    usuario: 'cajero-salon',
    nombre: 'Caja Salón',
    rol: 'Cajero',
    password: 'mesa123',
  },
];
