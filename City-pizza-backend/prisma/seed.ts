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

const PIZZAS: {
  nombre: string;
  tipo: string;
  categoria: string;
  personal: number;
  mediana: number;
  familiar: number;
  insumos: string[];
}[] = [
  { nombre: 'Hawaiana', tipo: 'Pizza', categoria: 'Clásicas', personal: 18, mediana: 25, familiar: 32, insumos: ['Queso mozzarella', 'Jamón', 'Piña en trozos'] },
  { nombre: 'Americana', tipo: 'Pizza', categoria: 'Clásicas', personal: 18, mediana: 25, familiar: 32, insumos: ['Queso mozzarella', 'Salame', 'Tocino', 'Jamón'] },
  { nombre: 'Pepperoni', tipo: 'Pizza', categoria: 'Clásicas', personal: 19, mediana: 26, familiar: 34, insumos: ['Queso mozzarella', 'Pepperoni'] },
  { nombre: 'Suprema', tipo: 'Pizza', categoria: 'Clásicas', personal: 20, mediana: 28, familiar: 36, insumos: ['Queso mozzarella', 'Pepperoni', 'Jamón', 'Tocino'] },
  { nombre: 'BBQ Chicken', tipo: 'Pizza', categoria: 'Especiales', personal: 22, mediana: 30, familiar: 38, insumos: ['Queso mozzarella', 'Pollo a la brasa'] },
  { nombre: 'Cuatro Quesos', tipo: 'Pizza', categoria: 'Especiales', personal: 22, mediana: 30, familiar: 38, insumos: ['Queso mozzarella'] },
  { nombre: 'Vegetariana', tipo: 'Pizza', categoria: 'Especiales', personal: 19, mediana: 26, familiar: 34, insumos: ['Queso mozzarella', 'Salsa de tomate'] },
  { nombre: 'Familiar Carnes', tipo: 'Pizza', categoria: 'Familiares', personal: 24, mediana: 33, familiar: 42, insumos: ['Queso mozzarella', 'Pepperoni', 'Salame', 'Tocino', 'Jamón'] },
  { nombre: 'Familiar La Cantina', tipo: 'Pizza', categoria: 'Familiares', personal: 23, mediana: 31, familiar: 40, insumos: ['Queso mozzarella', 'Pepperoni'] },
  { nombre: 'Gaseosa 1L', tipo: 'Bebida', categoria: 'Bebidas', personal: 8, mediana: 8, familiar: 8, insumos: ['Gaseosa 1L'] },
  { nombre: 'Gaseosa Personal', tipo: 'Bebida', categoria: 'Bebidas', personal: 4, mediana: 4, familiar: 4, insumos: ['Gaseosa personal'] },
];

const PROMOS = [
  { nombre: '2×1 Martes', descripcion: '2 pizzas familiares clásicas por S/58', precioPromo: 58, tipo: 'Permanente' as const },
  { nombre: 'Combo Familiar', descripcion: 'Familiar + Gaseosa 1L por S/45', precioPromo: 45, tipo: 'Permanente' as const },
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
      update: {
        tipo: p.tipo,
        categoria: p.categoria,
        precio: p.familiar,
        precioPersonal: p.personal,
        precioMediana: p.mediana,
        precioFamiliar: p.familiar,
      },
      create: {
        nombre: p.nombre,
        tipo: p.tipo,
        categoria: p.categoria,
        precio: p.familiar,
        precioPersonal: p.personal,
        precioMediana: p.mediana,
        precioFamiliar: p.familiar,
      },
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
  for (const promo of PROMOS) {
    const existe = await prisma.promocion.findFirst({ where: { nombre: promo.nombre } });
    if (!existe) {
      await prisma.promocion.create({ data: { ...promo, tipo: promo.tipo } });
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
  console.log('Seed OK: pizzas, insumos, promos y trabajadores demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
