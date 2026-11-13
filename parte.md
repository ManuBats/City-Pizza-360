# Integración de CityPizza360

La integración de los PR #1 a #5 quedó fusionada en `dev` mediante el PR #6. Los ajustes finales se publicaron en el commit `2a2b314`.

- [x] Se resolvieron los conflictos de integración. El seed base crea la cuenta de administración y los datos ficticios se cargan con el seed opcional.
- [x] Se reforzó el acceso con una política de contraseñas, límites de intentos y validación de la cuenta y el rol. Caja y Administración gestionan las comandas de salón tras la migración del rol Mesero.
- [x] Se integró la carta real con categorías, precio por tamaño e imágenes. El paquete de importación comparte 42 productos, cinco promociones, 40 imágenes y las recetas con sus insumos vinculados.
- [x] Se habilitó la edición de precios e imágenes y el pedido online de promociones vigentes. El carrito cobra el precio configurado y cocina recibe el nombre y la descripción del combo.
- [x] Se protegió el flujo de pedidos con validación de stock, reintentos idempotentes y permisos de reparto. Recojo y salón pueden cerrarse directamente desde «Listo».
- [x] Se configuró Yape de pruebas y se verificó el flujo de carga, rechazo, reemplazo y aprobación de comprobantes. Cocina requiere la aprobación del pago web antes de iniciar la preparación.
- [x] Se habilitó la recuperación del seguimiento desde el mismo navegador y la copia del código y del enlace al confirmar el pedido.
- [x] Se integraron los reportes de ventas y productos con filtros por fecha y pagos verificados.
- [x] Se verificaron la compilación, las 122 pruebas del backend y la compra de una promoción contra PostgreSQL. El README documenta cómo importar la carta y habilitar las promociones online.
