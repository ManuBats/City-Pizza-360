import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/lib/cart";
import { CATEGORIAS, type Categoria } from "@/lib/pizzas";
import Landing from "./routes/index";
import MenuPage from "./routes/menu";
import CheckoutPage from "./routes/checkout";
import TrackingPage from "./routes/tracking";
import LoginPage from "./routes/login";
import CocinaPage from "./routes/cocina";
import DeliveryPage from "./routes/delivery";
import CajeroPage from "./routes/cajero";
import MesaPage from "./routes/mesa";
import AdminPage from "./routes/admin";
import UsuariosPage from "./routes/admin-usuarios";
import { NotFoundComponent } from "./components/RootFeedback";
import "./styles.css";

// Router code-based (SPA). Migración a file-based (router.tsx + routeTree.gen
// + start.ts de Lovable) cuando pegues el resto de routes.
const rootRoute = createRootRoute({
  component: () => (
    <CartProvider>
      <Outlet />
    </CartProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  validateSearch: (search: Record<string, unknown>): { categoria?: Categoria | undefined } => ({
    categoria:
      typeof search.categoria === "string" &&
      (CATEGORIAS as string[]).includes(search.categoria)
        ? (search.categoria as Categoria)
        : undefined,
  }),
  component: MenuPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const trackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tracking",
  component: TrackingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const cocinaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cocina",
  component: CocinaPage,
});

const deliveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/delivery",
  component: DeliveryPage,
});

const cajeroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cajero",
  component: CajeroPage,
});

const mesaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mesa",
  component: MesaPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const adminUsuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/usuarios",
  component: UsuariosPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  menuRoute,
  checkoutRoute,
  trackingRoute,
  loginRoute,
  cocinaRoute,
  deliveryRoute,
  cajeroRoute,
  mesaRoute,
  adminRoute,
  adminUsuariosRoute,
]);
const router = createRouter({ routeTree });
const queryClient = new QueryClient();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
