# City-Pizza-360

Sistema integral City Pizza Center — San Vicente de Cañete.
Flujo: Menú -> Carrito -> Checkout invitado -> Tracking -> KDS -> Delivery -> Inventario -> Reportes.

## Estructura
- `City-pizza-backend/` — NestJS 10 + Prisma + PostgreSQL (local o Supabase)
- `City-pizza-frontend/` — Vite 8 + React 19 + TanStack Router/Query + Tailwind 4

## Dev
```bash
# backend
npm run dev
# frontend
npm run dev
```

## Base de datos y datos iniciales

```bash
cd City-pizza-backend
npm run prisma:migrate
npm run prisma:seed        # crea solo la cuenta de administrador
```

El seed mínimo usa `admin` / `city360` por defecto. En producción define
`ADMIN_USUARIO`, `ADMIN_NOMBRE` y `ADMIN_PASSWORD` antes de ejecutarlo.

Para cargar el catálogo, insumos, promociones y trabajadores de ejemplo
(solo desarrollo):

```bash
npm run prisma:seed:demo
```

El seed demo está bloqueado con `NODE_ENV=production`; se puede forzar con
`ALLOW_DEMO_SEED=true`, pero no se recomienda. Sin el seed demo, la tienda y el
panel arrancan vacíos y se llenan desde el panel de administración.
