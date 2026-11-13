# Integrar y verificar CityPizza360 en dev

Este ExecPlan es un documento vivo. Actualizar Progreso, Hallazgos, Decisiones y Resultados conforme avance el trabajo.

## Propósito

Dejar operativos el catálogo y el panel administrativo, las promociones públicas, el acceso del personal, las comandas de caja y el checkout con Yape. Demostrar que cada rol puede completar su trabajo, que una compra no deja stock negativo ni se duplica al reintentar, y que los comprobantes solo quedan disponibles a quien corresponda.

## Progreso

- [x] (2026-11-12, Lima) Revisar parte.md, los README, el resumen ATAM y los puntos de entrada del código; preparar el plan.
- [x] (2026-11-12, Lima) Recibir confirmación para empezar.
- [x] (2026-11-12, Lima) Verificar los PR #1–#5 contra dev: todos abiertos, con destino dev; #5 en borrador.
- [x] (2026-11-12, Lima) Integrar los cinco PR localmente en codex/integracion-citypizza360 (orden 1, 2, 4, 5, 3). Resolver README en 47535e1 y seed en 01d87ea.
- [x] (2026-11-12, Lima) Corregir permisos, estados, stock, compras duplicadas, privacidad de comprobantes, imágenes de promociones y precios con céntimos.
- [x] (2026-11-12, Lima) Ejecutar las migraciones en PostgreSQL aislado, verificar un pedido histórico y probar checkout móvil, Yape y reparto.
- [ ] Validar el número, titular y QR con el negocio antes de activar Yape real. La inspección o depuración de datos reales queda separada de la prueba aislada.

## Hallazgos

La rama de integración parte de dev en 41b433c. La consulta de la API de GitHub confirmó los cinco destinos dev y el borrador del PR #5. Los conflictos observados se limitaron a README.md y prisma/seed.ts. Se conservan parte.md y los archivos ATAM sin seguimiento.

En dev, JwtAuthGuard toma el rol del token sin consultar si la cuenta continúa activa. PedidosService comprueba stock por línea antes de la transacción y descuenta por línea dentro de ella. main.ts publica todo uploads, incluido el subdirectorio donde PedidosController escribe comprobantes antes de validar el pedido. Son observaciones de código; las 14 pruebas citadas en parte.md pertenecen a una ejecución anterior.

## Decisiones

Propuesta, 2026-11-12: partir del dev actualizado en una rama de integración aislada, conservar main intacta y apuntar cualquier PR nuevo a dev. Mantener el borrador #5 hasta que el equipo decida pasarlo a revisión.

Propuesta, 2026-11-12: en los gráficos de ventas y productos vendidos contar pedidos pagados, excluyendo pendientes y rechazados; conservar una métrica separada de pedidos operativos si aplica. Confirmar cómo se registra el cobro en efectivo para que entre en el informe cuando corresponda. Mostrar precios de promociones vigentes en la tienda; aplicar descuentos al pedido solo si se confirma el alcance y la regla de elegibilidad.

Propuesta, 2026-11-12: cocina puede comenzar un pedido web Yape después de la aprobación de caja. Un comprobante rechazado se puede reemplazar desde seguimiento mientras el pedido siga pendiente de preparación. Probar número, titular y QR ficticios; habilitar los reales tras validarlos con el negocio.

## Resultados

Integración local verificada. Pasaron 122 pruebas unitarias del backend, 17 del frontend y 5 pruebas de integración. Se aplicaron ocho migraciones y ambos seeds en PostgreSQL aislado. En la prueba histórica, Mesero pasó a Cajero; el importe y precio unitario se mantuvieron en S/ 15,00 tras subir la pizza a S/ 25,00. Se recorrió la carta, carrito, checkout, carga y seguimiento de recojo a 390 px con datos ficticios. La API confirmó fotos, reemplazo, céntimos, promociones visibles y reportes. No se modificaron ramas remotas.

## Contexto

City-pizza-frontend es la tienda React y los paneles del personal; src/routes registra las rutas y src/app contiene las pantallas. Los servicios HTTP están en src/services. City-pizza-backend usa NestJS y Prisma con PostgreSQL. prisma/schema.prisma define los modelos; prisma/migrations aplica cambios de esquema y datos. Cada pedido guarda sus líneas y sus importes en el momento de la compra. Un token JWT identifica al trabajador; la API debe comprobar también el estado y el rol vigentes de su cuenta.

## Plan de trabajo

1. Revisar PR #1 (promociones públicas), #2 (autenticación), #3 (caja y comandas), #4 (Yape) y #5 (carta, precios, dashboard y seeds). Verificar destino, commits, estado y conflictos actuales. Identificar cambios ya integrados y simular el orden sobre una rama temporal. Resolver README.md preservando la guía y documentando el seed base de administrador y el seed opcional de demostración. Al incorporar #3 y #5, conciliar City-pizza-backend/prisma/seed.ts con demo-data.ts, sustituyendo la cuenta Mesero de demostración por Cajero. Registrar el orden real y las resoluciones antes de proponer cambios remotos.

2. Integrar y probar las funciones de cada rama. Revisar City-pizza-backend/src/api/catalogo, promociones y reportes y sus pantallas y servicios del frontend. Crear una pizza con foto, reemplazarla, editar precios de pizzas y promociones, admitir céntimos y agregar gestión de imagen de promoción. Verificar fechas, ventas diarias y cinco productos por unidades en el dashboard; en /promociones solo deben verse las vigentes. Inventariar posibles pizzas y pedidos de prueba mediante consultas de solo lectura y preparar una propuesta de limpieza si se confirma su origen. Validar el límite de intentos y la política de contraseñas tras integrar #2.

3. Corregir los permisos y la operación. En City-pizza-backend/src/middlewares/jwt-auth.guard.ts consultar la cuenta activa y el rol vigente en cada solicitud protegida. En src/api/pedidos/controllers/pedidos.controller.ts y services/pedidos.service.ts pasar el actor a los cambios de estado y exigir al repartidor asignación y transiciones de entrega. En la API separar o proteger el alta de comandas para Caja y Administración y validar número de mesa; mantener el checkout público de delivery y recojo. Permitir Listo → Entregado para recojo y cierre de salón sin estado de reparto. Ajustar paneles y seguimiento para mostrar solo acciones y datos válidos por tipo y rol.

4. Corregir creación y concurrencia. En PedidosService.crear consultar pizzas por ID único y calcular importes y recetas por cada línea y tamaño. Acumular el consumo por insumo y descontar dentro de la transacción mediante actualizaciones condicionadas al saldo disponible; revertir todo si algún insumo no alcanza. Procesar insumos en orden estable. Introducir una clave de idempotencia (identificador conservado por el cliente durante los reintentos del mismo envío), con restricción única en PostgreSQL. La misma clave y datos devuelven el mismo pedido; reutilizarla con otro contenido se rechaza. El checkout y el envío de comandas reutilizan la clave ante doble clic o fallo de red. Mantener la ruta de seguimiento y el precio registrado en cada compra.

5. Cerrar el flujo de Yape. En src/api/pedidos limitar la subida a una credencial de cliente vinculada al pedido y la lectura a cliente autorizado y Caja/Administración. Recuperar la capacidad de subir desde seguimiento autorizado, sin confiar en un ID de pedido como prueba de identidad. Guardar comprobantes fuera del árbol público de src/main.ts, proteger sus rutas y adaptar caja, checkout y seguimiento. Validar tipo, tamaño y permiso antes de conservar el archivo; limpiar archivos rechazados, reemplazados o de operaciones fallidas. Mantener las fotos del catálogo públicas y persistentes. Hacer cumplir el requisito de pago aprobado en la API y reflejarlo en la cola y en el seguimiento.

6. Aplicar migraciones a una copia aislada con trabajadores Mesero, productos y pedidos previos. Demostrar que esas cuentas ahora operan en caja y que cambiar un precio no altera pedidos históricos. Ejecutar delivery con cuentas separadas de caja, cocina y reparto; ejecutar recojo y mesa hasta el cierre. En pantalla móvil recorrer menú, carrito, checkout, comprobante y seguimiento. Reiniciar el backend y volver a consultar las fotos subidas. Actualizar README y dejar evidencia por escenario.

## Pasos concretos

Desde la raíz, registrar git status --short y git branch -avv. Con acceso al remoto, consultar:

    gh pr view 1 --json state,isDraft,baseRefName,headRefName,mergeStateStatus,commits

Repetir para 2–5; verificar baseRefName dev y conservar el estado y los commits en este documento. Si falta acceso, revisar referencias disponibles y distinguir lo verificable localmente de lo pendiente en GitHub.

En City-pizza-backend, usar Node 22.12+ de la rama 22 y configurar DATABASE_URL para PostgreSQL desechable; usar JWT_SECRET propio de pruebas, PORT y FRONTEND_URL según README. Ejecutar:

    npm ci
    npm run prisma:generate
    npx prisma migrate deploy
    npm run build
    npm test -- --runInBand
    npm run test:e2e -- --runInBand
    npm run dev

En City-pizza-frontend, configurar VITE_API_URL al backend de prueba y ejecutar:

    npm ci
    npm run build
    npm run dev

El frontend debe abrir en http://localhost:5173 y consultar la API de prueba. Añadir a estos pasos los comandos definitivos de ambos seeds al conocer el resultado de la integración.

## Validación y aceptación

Comprobar que un repartidor recibe denegación al modificar pedidos ajenos o pasos de cocina y puede actualizar sus entregas asignadas. Un token previo de una cuenta desactivada devuelve 401 tanto en sesión como en listados protegidos. Una comanda sin sesión o mesa válida es rechazada, mientras que un cliente puede comprar por delivery o recojo sin sesión. El recojo y el salón cierran sin pasar por En camino.

Con 0,20 de un insumo, pedir dos líneas que consumen 0,15 cada una: debe rechazarse la compra y conservarse 0,20. Pedir la misma pizza en personal y mediano con stock suficiente: debe persistir cada línea a su precio y descontarse el consumo total. En PostgreSQL, lanzar dos compras distintas por el último stock: una sola se confirma. Repetir solicitudes con la misma clave, en paralelo y después de simular una respuesta perdida: un solo pedido y un solo descuento.

Crear un pedido Yape; cocina no puede iniciarlo antes de la aprobación. Subir un archivo, rechazarlo en caja, reemplazarlo desde seguimiento y aprobarlo; cocina puede continuar. Intentar adjuntar con solo el ID, abrir la ruta pública anterior y consultar sin permiso: no se debe poder. Revisar que una carga rechazada no deje archivos huérfanos. Verificar los resultados funcionales de catálogo, promociones, reportes, roles, migración y móvil descritos en los hitos, además de las compilaciones y pruebas automatizadas.

## Repetición y recuperación

Conservar las referencias originales y registrar los commits integrados. Repetir las pruebas con bases y directorios de carga desechables. Antes de la prueba de migración, guardar una copia del estado inicial para repetirla y comparar recuentos, roles e importes. Si falla la integración, corregir o abortar en la rama temporal. La depuración de datos reales requiere una lista verificable de registros y una decisión explícita antes de borrar. No aplicar migraciones ni usar datos de pago reales para las pruebas locales.

## Artefactos y notas

Registrar aquí la matriz de PR y conflictos, las pruebas ejecutadas y sus resultados, y una muestra de la comparación antes/después de migración. Usar identificadores ficticios y omitir credenciales, comprobantes y datos personales.

## Interfaces y dependencias

Reutilizar NestJS, Prisma, PostgreSQL, React y TanStack Query. Revisar POST /pedidos, PATCH /pedidos/:id/estado, GET /pedidos/tracking, POST /pedidos/:id/comprobante y PATCH /pedidos/:id/pago. Definir el alta autenticada de salón, la lectura protegida del comprobante y el contrato de la clave de idempotencia con ambos clientes antes de modificar las pantallas. Mantener GET /promociones/visibles público y los endpoints de reportes restringidos a Administración.
