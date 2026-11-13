# CityPizza360

CityPizza360 es el sistema de pedidos y operación de City Pizza Center, en San Vicente de Cañete. Reúne la tienda web y los paneles de salón, caja, cocina, reparto y administración.

## Cómo funciona

1. El cliente consulta la carta y realiza un pedido como invitado para delivery o recojo en tienda. El cajero registra las comandas de mesa desde el panel interno.
2. La API calcula el total, comprueba la disponibilidad de las pizzas y valida el stock según sus recetas. Registra el pedido, sus líneas y el descuento de insumos en una transacción.
3. Cocina consulta la cola de preparación. En el flujo de reparto, cocina puede asignar un repartidor y este consulta sus entregas asignadas. La secuencia de estados de la API es **Recibido → En preparación → Listo → En camino → Entregado**.
4. El cliente consulta el estado en `/tracking` con su código de pedido y celular. La pantalla de cocina actualiza sus datos cada 3 segundos y el seguimiento público cada 10 segundos.

El sistema admite efectivo y Yape. En pedidos web con Yape, caja o administración debe aprobar el comprobante antes de que cocina pueda iniciar la preparación. El cliente puede adjuntarlo o reemplazarlo desde seguimiento. Los comprobantes nuevos se guardan en `uploads-private/comprobantes/` y se consultan por la API con sesión de caja o administración. Las fotos públicas de catálogo y promociones se guardan en `uploads/productos/`. Conserva ambos directorios entre reinicios y despliegues.

### Acceso del personal

El personal ingresa por `/login`. La API usa JWT y permisos por rol en los endpoints protegidos.

| Rol | Panel | Funciones principales |
| --- | --- | --- |
| Administrador | `/admin`, `/admin/usuarios` | Gestionar catálogo, inventario, promociones y personal, y consultar reportes. También puede acceder a los demás paneles. |
| Cajero | `/cajero` | Consultar pedidos, revisar pagos Yape, cambiar la disponibilidad de la carta y publicar promociones flash y registrar comandas en `/mesa`. |
| Cocinero | `/cocina` | Consultar la cola de preparación, actualizar pedidos y asignar repartidores. |
| Repartidor | `/delivery` | Consultar entregas asignadas y actualizar su estado. |

## Arquitectura

| Carpeta | Responsabilidad |
| --- | --- |
| [City-pizza-frontend](City-pizza-frontend/) | SPA con React 19, Vite 8, TypeScript, TanStack Router, TanStack Query y Tailwind CSS 4. |
| [City-pizza-backend](City-pizza-backend/) | API REST modular con NestJS 10, Prisma 6 y PostgreSQL. El esquema y las migraciones están en `prisma/`. |
| [docs](docs/) | [Diagrama de arquitectura](docs/arquitectura-citypizza360.png). |

## Desarrollo local

Necesitas Node.js 22.12 o superior dentro de la rama 22, npm y una base de datos PostgreSQL de desarrollo. Ejecuta los siguientes comandos desde la raíz del repositorio, en dos terminales.

### Backend

```powershell
cd City-pizza-backend
npm ci
Copy-Item .env.example .env
```

Al crear el entorno por primera vez, edita `.env` con estos valores antes de aplicar las migraciones.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a tu base PostgreSQL de desarrollo. |
| `JWT_SECRET` | Secreto para firmar y verificar los tokens del personal. Usa un valor propio. |
| `PORT` | Puerto de la API. El valor local predeterminado es `3000`. |
| `FRONTEND_URL` | Origen permitido por CORS. El valor local predeterminado es `http://localhost:5173`. |

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
# Opcional: cargar datos ficticios en una base de desarrollo.
npm run prisma:seed:demo
npm run dev
```

El seed base crea solo la cuenta de administrador. Configura `ADMIN_USUARIO`, `ADMIN_NOMBRE` y `ADMIN_PASSWORD` antes de ejecutarlo. El seed de demostración añade catálogo, insumos, promociones y trabajadores ficticios.

### Importar la carta compartida

Desde `City-pizza-backend`, con `DATABASE_URL` apuntando a tu base de desarrollo, ejecuta:

```powershell
npx prisma migrate deploy
npm run prisma:generate
npm run catalogo:importar
```

El paquete en `prisma/catalogo/` contiene la carta y sus fotos. La importación copia las imágenes a `uploads/productos/` y actualiza los productos que ya existen por nombre, incluidos sus precios y las fotos incluidas en el paquete. Si hay recetas, añade o actualiza sus insumos vinculados y conserva las existencias locales. Las promociones conservan sus fechas de vigencia. El paquete se limita a datos del catálogo.

Para compartir productos, fotos o promociones que hayas añadido en tu equipo, ejecuta `npm run catalogo:exportar` desde `City-pizza-backend`. Incluye en el commit el manifiesto `prisma/catalogo/catalogo.json` y las imágenes que referencia en `prisma/catalogo/fotos/`. Sube ese commit a GitHub. Tus compañeros pueden traerlo y ejecutar los tres comandos anteriores para tener la carta y sus fotos en su entorno local.

El manifiesto también guarda las recetas, los insumos vinculados y la configuración de las promociones, incluida la opción de pedido online al volver a exportar. Las existencias, los pedidos, las cuentas y la configuración de Yape son propios de cada entorno.

### Frontend

```powershell
cd City-pizza-frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` apunta a la API y viene configurada como `http://localhost:3000` en el ejemplo. Si cambias el puerto de la API, actualiza esa variable antes de iniciar Vite. Abre `http://localhost:5173` para acceder a la tienda.

Con `npm run dev`, si las tres variables de Yape están vacías, el checkout usa el número y el QR que aportó el equipo en el PR #4 para probar el flujo con su cuenta de pruebas. Si necesitas usar otra cuenta, configura juntos `VITE_YAPE_TITULAR`, `VITE_YAPE_NUMERO` y `VITE_YAPE_QR_URL`. En una compilación de producción las tres variables son obligatorias para habilitar Yape; usa los datos confirmados por el negocio.

Los gráficos de ventas y productos vendidos cuentan pedidos con pago verificado. El efectivo se registra al marcar el pedido como entregado.

## Promociones online

1. Actualiza tu copia del repositorio. Desde `City-pizza-backend`, ejecuta `npx prisma migrate deploy` y `npm run prisma:generate`. Reinicia el backend si estaba en ejecución.
2. En **Administración → Promociones permanentes**, crea una promoción o abre el editor de una existente. En **Caja**, la casilla está disponible al crear una promoción Flash.
3. Indica el precio del combo y describe qué incluye. Marca **Se puede pedir online** y guarda. Con la casilla desmarcada, la promoción sigue visible en la vitrina mientras esté activa y vigente.
4. En la tienda, abre **Promociones**, pulsa **Agregar al carrito** y verifica el precio antes de confirmar. Cocina recibe el nombre y la descripción del combo. El descuento automático de insumos por cada componente del combo sigue pendiente.

Las promociones existentes tienen la casilla desmarcada por defecto tras la migración. Si una promoción vence o se deshabilita mientras está en el carrito, retírala para continuar. Si cambia el precio, revisa el total actualizado y vuelve a confirmar.

## API y verificación

| Área | Endpoints principales |
| --- | --- |
| Tienda | `GET /pizzas`, `GET /promociones/visibles`, `POST /pedidos`, `GET /pedidos/tracking`, `POST /pedidos/:id/comprobante` |
| Sesión | `POST /auth/login`, `GET /auth/session` |
| Operación | `GET /pedidos`, `GET /cocina/cola`, `GET /pedidos/mis-entregas`, `PATCH /pedidos/:id/estado`, `PATCH /pedidos/:id/asignar`, `PATCH /pedidos/:id/pago` |
| Administración | Módulos `/pizzas`, `/inventario`, `/promociones`, `/trabajadores` y `/reportes`. |

Ejecuta `npm run build` dentro de cada aplicación para compilarla. Desde el backend, ejecuta `npm test` para las pruebas unitarias, `npm run test:e2e` para las pruebas de integración de la aplicación y `npm run test:cov` para generar el informe de cobertura.
