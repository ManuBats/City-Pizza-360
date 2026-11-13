# CityPizza360

CityPizza360 es el sistema de pedidos y operación de City Pizza Center, en San Vicente de Cañete. Reúne la tienda web y los paneles de salón, caja, cocina, reparto y administración.

## Cómo funciona

1. El cliente consulta la carta y realiza un pedido como invitado para delivery o recojo en tienda. El mesero registra las comandas de mesa desde el panel interno.
2. La API calcula el total, comprueba la disponibilidad de las pizzas y valida el stock según sus recetas. Registra el pedido, sus líneas y el descuento de insumos en una transacción.
3. Cocina consulta la cola de preparación. En el flujo de reparto, cocina puede asignar un repartidor y este consulta sus entregas asignadas. La secuencia de estados de la API es **Recibido → En preparación → Listo → En camino → Entregado**.
4. El cliente consulta el estado en `/tracking` con su código de pedido y celular. La pantalla de cocina actualiza sus datos cada 3 segundos y el seguimiento público cada 10 segundos.

El sistema admite efectivo y Yape. Para pedidos web con Yape, el cliente puede adjuntar un comprobante y caja o administración lo verifica manualmente. El QR real de Yape está pendiente de configuración. Los comprobantes y las imágenes de productos subidas se guardan en el directorio local `uploads/` del backend.

### Acceso del personal

El personal ingresa por `/login`. La API usa JWT y permisos por rol en los endpoints protegidos.

| Rol | Panel | Funciones principales |
| --- | --- | --- |
| Administrador | `/admin`, `/admin/usuarios` | Gestionar catálogo, inventario, promociones y personal, y consultar reportes. También puede acceder a los demás paneles. |
| Cajero | `/cajero` | Consultar pedidos, revisar pagos Yape, cambiar la disponibilidad de la carta y publicar promociones flash. |
| Cocinero | `/cocina` | Consultar la cola de preparación, actualizar pedidos y asignar repartidores. |
| Repartidor | `/delivery` | Consultar entregas asignadas y actualizar su estado. |
| Mesero | `/mesa` | Registrar comandas de mesa con notas por producto. |

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
# Opcional: cargar catálogo, insumos y cuentas de demostración en desarrollo.
npm run prisma:seed
npm run dev
```

### Frontend

```powershell
cd City-pizza-frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

`VITE_API_URL` apunta a la API y viene configurada como `http://localhost:3000` en el ejemplo. Si cambias el puerto de la API, actualiza esa variable antes de iniciar Vite. Abre `http://localhost:5173` para acceder a la tienda.

## API y verificación

| Área | Endpoints principales |
| --- | --- |
| Tienda | `GET /pizzas`, `GET /promociones/visibles`, `POST /pedidos`, `GET /pedidos/tracking`, `POST /pedidos/:id/comprobante` |
| Sesión | `POST /auth/login`, `GET /auth/session` |
| Operación | `GET /pedidos`, `GET /cocina/cola`, `GET /pedidos/mis-entregas`, `PATCH /pedidos/:id/estado`, `PATCH /pedidos/:id/asignar`, `PATCH /pedidos/:id/pago` |
| Administración | Módulos `/pizzas`, `/inventario`, `/promociones`, `/trabajadores` y `/reportes`. |

Ejecuta `npm run build` dentro de cada aplicación para compilarla. Desde el backend, ejecuta `npm test` para las pruebas unitarias, `npm run test:e2e` para las pruebas de integración de la aplicación y `npm run test:cov` para generar el informe de cobertura.
