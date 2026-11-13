ALTER TABLE "Promocion" ADD COLUMN "pedidoOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DetallePedido"
  ALTER COLUMN "pizzaId" DROP NOT NULL,
  ADD COLUMN "promocionNombre" TEXT,
  ADD COLUMN "promocionDescripcion" TEXT,
  ADD CONSTRAINT "DetallePedido_producto_o_promocion_check"
    CHECK (("pizzaId" IS NOT NULL) <> ("promocionNombre" IS NOT NULL));
