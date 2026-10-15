/** Espejo de Prisma: Trabajador (módulo Auth/Admin). */
export type Rol = "Admin" | "Cajero" | "Cocinero" | "Repartidor" | "Mesero";

export type RolUi = "admin" | "cajero" | "cocina" | "delivery" | "mesero";

export type WorkerSession = {
  usuario: string;
  nombre: string;
  rol: RolUi;
};

export type WorkerAdmin = WorkerSession & { activo: boolean };

export type LoginResponse = WorkerSession & { token: string };

/** Roles de la UI (mock; el backend usa mayúsculas: ver mapeo en Fase 3). */
export const ROLES_UI: { value: RolUi; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "cajero", label: "Cajero" },
  { value: "cocina", label: "Cocina" },
  { value: "delivery", label: "Delivery" },
  { value: "mesero", label: "Mesero" },
];

export const ROL_LABEL_UI: Record<RolUi, string> = Object.fromEntries(
  ROLES_UI.map((r) => [r.value, r.label]),
) as Record<RolUi, string>;
