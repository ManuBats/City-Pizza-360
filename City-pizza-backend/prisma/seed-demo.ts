/**
 * Seed de demostración: catálogo, insumos, promociones y trabajadores de ejemplo.
 * Uso: `npm run prisma:seed:demo` (después de `npm run prisma:seed`).
 * Nunca se ejecuta en producción salvo que se fuerce con ALLOW_DEMO_SEED=true.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  INSUMOS_DEMO,
  PIZZAS_DEMO,
  PROMOS_DEMO,
  TRABAJADORES_DEMO,
} from './demo-data';

const prisma = new PrismaClient();

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DEMO_SEED !== 'true'
  ) {
    throw new Error(
      'Seed demo bloqueado en producción. Usa ALLOW_DEMO_SEED=true para forzarlo.',
    );
  }

  for (const insumo of INSUMOS_DEMO) {
    await prisma.insumo.upsert({
      where: { nombre: insumo.nombre },
      update: {},
      create: insumo,
    });
  }

  for (const p of PIZZAS_DEMO) {
    const pizza = await prisma.pizza.upsert({
      where: { nombre: p.nombre },
      update: {
        tipo: p.tipo,
        categoria: p.categoria,
        descripcion: p.descripcion,
        destacada: p.destacada ?? false,
        precio: p.familiar,
        precioPersonal: p.personal,
        precioMediana: p.mediana,
        precioFamiliar: p.familiar,
      },
      create: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        destacada: p.destacada ?? false,
        tipo: p.tipo,
        categoria: p.categoria,
        precio: p.familiar,
        precioPersonal: p.personal,
        precioMediana: p.mediana,
        precioFamiliar: p.familiar,
      },
    });
    for (const nombreInsumo of p.insumos) {
      const insumo = await prisma.insumo.findUniqueOrThrow({
        where: { nombre: nombreInsumo },
      });
      await prisma.pizzaInsumo.upsert({
        where: {
          pizzaId_insumoId: { pizzaId: pizza.id, insumoId: insumo.id },
        },
        update: {},
        create: {
          pizzaId: pizza.id,
          insumoId: insumo.id,
          cantidad: 0.15,
        },
      });
    }
  }

  for (const promo of PROMOS_DEMO) {
    const existe = await prisma.promocion.findFirst({
      where: { nombre: promo.nombre },
    });
    if (!existe) {
      await prisma.promocion.create({
        data: { ...promo, tipo: promo.tipo },
      });
    }
  }

  for (const trabajador of TRABAJADORES_DEMO) {
    await prisma.trabajador.upsert({
      where: { usuario: trabajador.usuario },
      update: {},
      create: {
        usuario: trabajador.usuario,
        nombre: trabajador.nombre,
        rol: trabajador.rol,
        passHash: await bcrypt.hash(trabajador.password, 10),
      },
    });
  }

  console.log(
    'Seed demo OK: pizzas, insumos, promociones y trabajadores de ejemplo.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
