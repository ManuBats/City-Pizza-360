-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'Yape');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('Pendiente', 'Verificado', 'Rechazado');

-- CreateEnum
CREATE TYPE "TipoPromocion" AS ENUM ('Permanente', 'Flash');

-- AlterTable
ALTER TABLE "DetallePedido" ADD COLUMN     "extraQueso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nota" TEXT,
ADD COLUMN     "tamano" TEXT NOT NULL DEFAULT 'Familiar';

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "comprobanteUrl" TEXT,
ADD COLUMN     "estadoPago" "EstadoPago" NOT NULL DEFAULT 'Pendiente',
ADD COLUMN     "mesa" INTEGER,
ADD COLUMN     "metodoPago" "MetodoPago" NOT NULL DEFAULT 'Efectivo',
ADD COLUMN     "repartidorId" INTEGER,
ADD COLUMN     "tipoEntrega" TEXT NOT NULL DEFAULT 'Delivery';

-- AlterTable
ALTER TABLE "Pizza" ADD COLUMN     "categoria" TEXT NOT NULL DEFAULT 'Clásicas',
ADD COLUMN     "precioFamiliar" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "precioMediana" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "precioPersonal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'Pizza',
ALTER COLUMN "precio" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Promocion" ADD COLUMN     "tipo" "TipoPromocion" NOT NULL DEFAULT 'Permanente',
ALTER COLUMN "fin" DROP NOT NULL;
