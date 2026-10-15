import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createRootRouteWithContext,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getWorkerSession } from "@/lib/auth";
import { puedeAcceder } from "@/lib/access-control";
import { CATEGORIAS, type Categoria } from "@/lib/pizzas";
import { AppShell } from "./app/shell";
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
import { NotFoundComponent } from "./app/not-found";
import "./styles.css";

// Router code-based (SPA). routes/ son adaptadores finos: path + validación
// + guard, y renderizan el page.tsx correspondiente de src/app/.
interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
  notFoundComponent: NotFoundComponent,
});

/** Guard estilo proxy.ts de CCA: sin rol con acceso → /login. */
function staffGuard(path: string) {
  return async ({ context }: { context: RouterContext }) => {
    const session = await context.queryClient.fetchQuery({
      queryKey: ["worker-session"],
      queryFn: () => getWorkerSession(),
      staleTime: 30_000,
    });
    if (!puedeAcceder(session?.rol, path)) {
      throw redirect({ to: "/login" });
    }
  };
}

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
  beforeLoad: staffGuard("/cocina"),
  component: CocinaPage,
});

const deliveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/delivery",
  beforeLoad: staffGuard("/delivery"),
  component: DeliveryPage,
});

const cajeroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cajero",
  beforeLoad: staffGuard("/cajero"),
  component: CajeroPage,
});

const mesaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mesa",
  beforeLoad: staffGuard("/mesa"),
  component: MesaPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: staffGuard("/admin"),
  component: AdminPage,
});

const adminUsuariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/usuarios",
  beforeLoad: staffGuard("/admin/usuarios"),
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
const queryClient = new QueryClient();
const router = createRouter({ routeTree, context: { queryClient } });

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
