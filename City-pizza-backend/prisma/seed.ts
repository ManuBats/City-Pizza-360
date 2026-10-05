/** Seed CityPizza360: catálogo (11 productos), insumos y trabajadores demo. */
import { PrismaClient, type Rol } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const INSUMOS = [
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

const PIZZAS: { nombre: string; precio: number; insumos: string[] }[] = [
  { nombre: 'Hawaiana', precio: 32, insumos: ['Queso mozzarella', 'Jamón', 'Piña en trozos'] },
  { nombre: 'Americana', precio: 32, insumos: ['Queso mozzarella', 'Salame', 'Tocino', 'Jamón'] },
  { nombre: 'Pepperoni', precio: 34, insumos: ['Queso mozzarella', 'Pepperoni'] },
  { nombre: 'Suprema', precio: 36, insumos: ['Queso mozzarella', 'Pepperoni', 'Jamón', 'Tocino'] },
  { nombre: 'BBQ Chicken', precio: 38, insumos: ['Queso mozzarella', 'Pollo a la brasa'] },
  { nombre: 'Cuatro Quesos', precio: 38, insumos: ['Queso mozzarella'] },
  { nombre: 'Vegetariana', precio: 34, insumos: ['Queso mozzarella', 'Salsa de tomate'] },
  { nombre: 'Familiar Carnes', precio: 42, insumos: ['Queso mozzarella', 'Pepperoni', 'Salame', 'Tocino', 'Jamón'] },
  { nombre: 'Familiar La Cantina', precio: 40, insumos: ['Queso mozzarella', 'Pepperoni'] },
  { nombre: 'Gaseosa 1L', precio: 8, insumos: ['Gaseosa 1L'] },
  { nombre: 'Gaseosa Personal', precio: 4, insumos: ['Gaseosa personal'] },
];

const WORKERS: { usuario: string; nombre: string; rol: Rol; password: string }[] = [
  { usuario: 'admin', nombre: 'Administrador', rol: 'Admin', password: 'city360' },
  { usuario: 'cajero', nombre: 'Caja Turno Noche', rol: 'Cajero', password: 'caja123' },
  { usuario: 'cocina', nombre: 'Cocina Principal', rol: 'Cocinero', password: 'cocina123' },
  { usuario: 'delivery', nombre: 'José Ramírez', rol: 'Repartidor', password: 'moto123' },
  { usuario: 'mesero', nombre: 'Mesero Salón', rol: 'Mesero', password: 'mesa123' },
];

async function main() {
  for (const ins of INSUMOS) {
    await prisma.insumo.upsert({
      where: { nombre: ins.nombre },
      update: {},
      create: ins,
    });
  }
  for (const p of PIZZAS) {
    const pizza = await prisma.pizza.upsert({
      where: { nombre: p.nombre },
      update: { precio: p.precio },
      create: { nombre: p.nombre, precio: p.precio },
    });
    for (const nombreInsumo of p.insumos) {
      const insumo = await prisma.insumo.findUniqueOrThrow({ where: { nombre: nombreInsumo } });
      await prisma.pizzaInsumo.upsert({
        where: { pizzaId_insumoId: { pizzaId: pizza.id, insumoId: insumo.id } },
        update: {},
        create: { pizzaId: pizza.id, insumoId: insumo.id, cantidad: 0.15 },
      });
    }
  }
  for (const w of WORKERS) {
    await prisma.trabajador.upsert({
      where: { usuario: w.usuario },
      update: {},
      create: {
        usuario: w.usuario,
        nombre: w.nombre,
        rol: w.rol,
        passHash: await bcrypt.hash(w.password, 10),
      },
    });
  }
  console.log('Seed OK: pizzas, insumos y trabajadores demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
