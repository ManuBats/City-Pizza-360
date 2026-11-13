# Confirmar pedidos Yape con captura

## Purpose / Big Picture

El cliente puede consultar el QR y volver al carrito con la X. Caja recibe el pedido cuando el cliente envía una captura válida y se registra la compra.

## Progress

- [x] Identificar el alta anticipada en el checkout.
- [x] Enviar el pedido y la captura en una sola solicitud.
- [x] Verificar el flujo contra PostgreSQL y comprobar los tipos del frontend.

## Surprises & Discoveries

El servicio ya verifica el formato de la imagen y exige comprobante para aprobar el pago en Caja. El alta pública admitía Yape antes de recibir la imagen.

## Decision Log

Se añade una ruta multipart, que envía datos e imagen en la misma solicitud. La imagen privada se vincula al crear el pedido y se retira si falla la creación. Se conserva la ruta de reemplazo para comprobantes rechazados.

## Outcomes & Retrospective

Pasaron las seis pruebas de integración de pedidos y la comprobación de TypeScript. La prueba de Yape verificó el rechazo de pedidos sin captura y de archivos inválidos, el alta con captura, el reintento sin duplicar el pedido, el reemplazo y la aprobación desde Caja.

## Context and Orientation

`City-pizza-frontend/src/hooks/use-checkout.ts` valida el carrito y envía el pedido. `City-pizza-frontend/src/components/checkout/YapeModal.tsx` muestra el QR. El controlador y servicio de `City-pizza-backend/src/api/pedidos` reciben el pedido, descuentan stock y guardan el comprobante.

## Plan of Work

Abrir el modal tras validar el formulario y enviar la compra al confirmar con una captura. Rechazar el alta web Yape sin captura en el servicio. Mantener el pago pendiente de revisión y el reemplazo desde seguimiento.

## Concrete Steps

Desde `City-pizza-backend`, ejecutar `node node_modules/jest/bin/jest.js --config ./test/jest-e2e.json --runInBand pedidos.e2e-spec.ts`. Desde `City-pizza-frontend`, ejecutar `node node_modules/typescript/bin/tsc --noEmit`.

## Validation and Acceptance

El alta JSON por Yape devuelve 400 y el alta con una captura PNG devuelve 201. Caja puede leer y aprobar el comprobante. Al cerrar el QR antes de enviar, el cliente conserva el carrito.

## Idempotence and Recovery

El reintento de la misma compra y captura conserva la clave de solicitud. La transacción conserva el stock si el alta falla.

## Artifacts and Notes

La prueba de integración usa una imagen PNG de un píxel.

## Interfaces and Dependencies

`POST /pedidos/yape` recibe el campo `pedido` como JSON y el campo `comprobante` como archivo. El backend reutiliza Multer para leer la imagen y el DTO habitual para validar los datos.

El 13 de noviembre de 2026 se registró el resultado de las pruebas y se documentaron los comandos ejecutados.
