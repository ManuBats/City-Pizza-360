-- Elimina el rol "Mesero" y transfiere sus cuentas existentes a "Cajero".
UPDATE "Trabajador" SET "rol" = 'Cajero' WHERE "rol" = 'Mesero';

-- PostgreSQL no permite eliminar un valor de un enum: se recrea el tipo.
CREATE TYPE "Rol_new" AS ENUM ('Admin', 'Cajero', 'Cocinero', 'Repartidor');

ALTER TABLE "Trabajador"
ALTER COLUMN "rol" TYPE "Rol_new"
USING ("rol"::text::"Rol_new");

DROP TYPE "Rol";

ALTER TYPE "Rol_new" RENAME TO "Rol";
