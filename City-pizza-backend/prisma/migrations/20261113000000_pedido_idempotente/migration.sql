ALTER TABLE "Pedido" ADD COLUMN "claveSolicitud" TEXT, ADD COLUMN "huellaSolicitud" TEXT;
CREATE UNIQUE INDEX "Pedido_claveSolicitud_key" ON "Pedido"("claveSolicitud");
