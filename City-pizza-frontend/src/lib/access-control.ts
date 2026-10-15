import type { RolUi } from "@/types/trabajador";

/**
 * Matriz rol → rutas (equivale a lib/access-control.ts de CCA).
 * Fuente única de verdad para el guard de rutas y el login.
 */
const RUTAS_POR_ROL: Record<RolUi, string> = {
  admin: "/admin",
  cajero: "/cajero",
  cocina: "/cocina",
  delivery: "/delivery",
  mesero: "/mesa",
};

const RUTAS_POR_MODULO: { modulo: string; match: (pathname: string) => boolean }[] = [
  { modulo: "admin", match: (p) => p.startsWith("/admin") },
  { modulo: "cajero", match: (p) => p.startsWith("/cajero") },
  { modulo: "cocina", match: (p) => p.startsWith("/cocina") },
  { modulo: "delivery", match: (p) => p.startsWith("/delivery") },
  { modulo: "mesa", match: (p) => p.startsWith("/mesa") },
];

const ACCESO_POR_ROL: Record<RolUi, string[]> = {
  admin: ["admin", "cajero", "cocina", "delivery", "mesa"],
  cajero: ["cajero"],
  cocina: ["cocina"],
  delivery: ["delivery"],
  mesero: ["mesa"],
};

const RUTAS_PUBLICAS = ["/", "/menu", "/checkout", "/tracking", "/login"];

export function rutaInicialPorRol(rol: RolUi): string {
  return RUTAS_POR_ROL[rol] ?? "/admin";
}

export function puedeAcceder(rol: RolUi | undefined, pathname: string): boolean {
  if (RUTAS_PUBLICAS.includes(pathname)) return true;
  if (!rol) return false;
  const modulo = RUTAS_POR_MODULO.find((r) => r.match(pathname))?.modulo;
  if (!modulo) return true;
  return ACCESO_POR_ROL[rol].includes(modulo);
}
