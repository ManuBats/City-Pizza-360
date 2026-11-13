# Integración de CityPizza360

La rama de desarrollo es `dev` y es el destino de los PR de esta entrega. La rama `codex/integracion-citypizza360` reúne los cinco PR, las correcciones posteriores a la integración y las promociones en el carrito.

## Ramas y PR

El estado de GitHub de la tabla corresponde a la revisión del 12 de noviembre de 2026. Los cinco PR se integraron localmente en el orden #1, #2, #4, #5 y #3.

| Responsable | Rama | PR y estado en la revisión |
| --- | --- | --- |
| Jeferson (Almeyda) | `feature/promociones-cliente` | [#1](https://github.com/ManuBats/City-Pizza-360/pull/1), abierto hacia `dev`. |
| Jeferson (Almeyda) | `feature/mejoras-autenticacion` | [#2](https://github.com/ManuBats/City-Pizza-360/pull/2), abierto hacia `dev`. |
| Yadhira | `feat/rol-cajero-sin-mesero` | [#3](https://github.com/ManuBats/City-Pizza-360/pull/3), abierto hacia `dev`. |
| Yadhira | `feat/configurar-yape` | [#4](https://github.com/ManuBats/City-Pizza-360/pull/4), abierto hacia `dev`. |
| Luis y Matias | `feat/admin-carta-promociones-precios` | [#5](https://github.com/ManuBats/City-Pizza-360/pull/5), en borrador hacia `dev`. Incluye `b0511f7`, `592838f` y `ced8cfc`. |

## Trabajo completado

- [x] Resolver los conflictos de `README.md` y `prisma/seed.ts`. El seed base crea solo el administrador y el seed opcional carga datos de demostración con una cuenta de caja para salón.
- [x] Integrar el dashboard con filtro por fechas, ventas diarias y hasta cinco productos por unidades. Los gráficos cuentan pedidos con pago verificado y el efectivo se registra al marcar el pedido como entregado.
- [x] Habilitar la creación de pizzas, la carga y el reemplazo de fotos y la edición de precios con céntimos. Agregar imágenes y precios con céntimos a las promociones.
- [x] Mostrar las ofertas vigentes y aplicar al carrito web la mejor promoción por producto y tamaño. Administración y Caja pueden vincular las nuevas ofertas y Administración puede editar las existentes.
- [x] Integrar la política de contraseñas, el límite de intentos de inicio de sesión por instancia y la comprobación de la cuenta y el rol vigentes en rutas protegidas.
- [x] Dar acceso a `/mesa` a Caja y Administración. Aplicar y verificar la migración de Mesero a Cajero con datos previos en una base aislada.
- [x] Configurar el número y el QR que Yadhira aportó para pruebas. Con las tres variables de Yape vacías, `npm run dev` muestra la cuenta de pruebas y permite copiar su número. Producción exige configurar el titular, el número y el QR juntos. Se comprobó que la compilación de producción excluye el número y el QR de pruebas.

## Correcciones de los fallos reproducidos en dev

| Prioridad | Fallo original | Resultado de la integración local |
| --- | --- | --- |
| Alta | Un repartidor pudo avanzar un pedido ajeno a «En preparación». | La API limita al repartidor a las transiciones de entrega de sus pedidos asignados. Se probó el rechazo y se completó un delivery con Caja, Cocina y Reparto. |
| Alta | El token de una cuenta desactivada aún podía listar pedidos. | Se verificó que el token anterior de Caja recibe 401 al consultar pedidos. |
| Alta | Dos líneas de 0,15 consumieron un insumo con solo 0,20 de saldo. | La API acumula el consumo y lo descuenta en una transacción. Se verificó que el saldo se conserva al rechazar el pedido y que solo una compra simultánea obtiene el último stock. |
| Alta | Cocina podía iniciar un pedido Yape antes de que el cliente adjuntara su comprobante. | La API exige que Caja apruebe el pago antes de iniciar la preparación del pedido web. Se probó adjuntar, rechazar, reemplazar y aprobar el comprobante. |
| Media | La API aceptaba una comanda anónima sin número de mesa. | El alta de salón exige sesión de Caja o Administración y una mesa del 1 al 12. Se verificó el rechazo del alta anónima y el checkout público. |
| Media | Pedir la misma pizza en dos tamaños devolvía «Alguna pizza no existe». | Se comprobó que un pedido admite ambos tamaños, suma sus precios y descuenta el consumo acumulado. |
| Media | El recojo tenía que pasar por «En camino» y mostraba información de repartidor. | Se implementó el cierre directo de recojo y salón desde «Listo». En el seguimiento móvil del recojo se verificó que se omiten el paso «En camino» y el bloque de repartidor. |

## Evidencia de verificación

- Compilaron el backend y el frontend. La suite de integración con PostgreSQL aislado ahora tiene seis pruebas, incluida la promoción por tamaño y el rechazo de un total desactualizado.
- Las solicitudes simultáneas y el reintento con la misma clave devolvieron un solo pedido y aplicaron un solo descuento de stock.
- Se verificó que el ID por sí solo no autoriza una carga de comprobante, que Caja puede abrirlo desde la API protegida y que una solicitud anónima o de Reparto no puede leerlo. El directorio público sirve las fotos de catálogo y promociones, y la antigua ruta pública de comprobantes devolvió 404 en la prueba.
- Se aplicaron nueve migraciones en la base aislada y se ejecutaron ambos seeds durante la integración. En la prueba histórica, la cuenta Mesero pasó a Cajero y el pedido conservó S/ 15,00 después de cambiar el precio de la pizza a S/ 25,00.
- Se recorrieron menú, carrito, checkout, carga de imagen y seguimiento a 390 px con datos ficticios. Se verificaron por API la carga y el reemplazo de fotos, los precios con céntimos, las promociones visibles y los reportes. Las fotos se sirvieron al iniciar otra instancia del backend.

## Pendientes

- [ ] Revisar la integración para su entrega a `dev` y confirmar el estado de los PR en GitHub al momento de publicar.
- [x] Auditar PostgreSQL local en solo lectura. De 12 productos y 15 pedidos, dos pedidos coincidieron con términos de prueba y ningún producto coincidió. Los candidatos requieren revisión antes de cualquier limpieza.
- [ ] Validar el titular, número y QR del negocio cuando corresponda habilitar Yape en producción. El recorrido móvil registrado usó datos ficticios.
- [x] Verificar por API el cierre de salón y recojo hasta «Entregado». Comparar los archivos antes y después de una carga rechazada y comprobar que el archivo anterior se retira al reemplazarlo.

El [plan de implementación](execplan/citypizza360-integracion.md) conserva los pasos técnicos y los criterios de aceptación.
