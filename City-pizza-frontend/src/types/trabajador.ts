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
