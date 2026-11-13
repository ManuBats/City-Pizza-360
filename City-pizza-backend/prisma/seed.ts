/**
 * Seed mínimo de CityPizza360: solo crea la cuenta de administrador.
 * El catálogo, insumos y trabajadores de ejemplo están en `prisma:seed:demo`.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_USUARIO = process.env.ADMIN_USUARIO?.trim() || 'admin';
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE?.trim() || 'Administrador';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'city360';

async function main() {
  const existente = await prisma.trabajador.findUnique({
    where: { usuario: ADMIN_USUARIO },
  });
  if (existente) {
    console.log(`Seed OK: el administrador "${ADMIN_USUARIO}" ya existe.`);
    return;
  }

  await prisma.trabajador.create({
    data: {
      usuario: ADMIN_USUARIO,
      nombre: ADMIN_NOMBRE,
      rol: 'Admin',
      passHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });

  console.log(`Seed OK: administrador "${ADMIN_USUARIO}" creado.`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      'Aviso: se usó la contraseña por defecto. Define ADMIN_PASSWORD antes de ejecutar el seed en producción.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
