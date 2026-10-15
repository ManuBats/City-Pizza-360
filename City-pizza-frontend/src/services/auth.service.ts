import { apiFetch } from "./api";
import type {
  LoginResponse,
  Rol,
  RolUi,
  WorkerAdmin,
  WorkerSession,
} from "@/types/trabajador";

type RolBackend = "Admin" | "Cajero" | "Cocinero" | "Repartidor" | "Mesero";

const ROL_UI_POR_BACKEND: Record<RolBackend, RolUi> = {
  Admin: "admin",
  Cajero: "cajero",
  Cocinero: "cocina",
  Repartidor: "delivery",
  Mesero: "mesero",
};

const ROL_BACKEND_POR_UI: Record<RolUi, RolBackend> = {
  admin: "Admin",
  cajero: "Cajero",
  cocina: "Cocinero",
  delivery: "Repartidor",
  mesero: "Mesero",
};

/** Normaliza "Admin" → "admin" (gap 2 del contrato). */
export function normalizarRol(rol: string): RolUi {
  return ROL_UI_POR_BACKEND[rol as RolBackend] ?? "cajero";
}

type SessionBackend = { usuario: string; nombre: string; rol: string };
type LoginBackend = SessionBackend & { token: string };

function aSesion(w: SessionBackend): WorkerSession {
  return { usuario: w.usuario, nombre: w.nombre, rol: normalizarRol(w.rol) };
}

/** Módulo Auth + gestión de trabajadores (solo admin). Habla con el backend real. */
export const AuthService = {
  async login(usuario: string, password: string): Promise<LoginResponse> {
    const res = await apiFetch<LoginBackend>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario: usuario.trim(), password }),
    });
    return { ...aSesion(res), token: res.token };
  },

  async me(): Promise<WorkerSession> {
    return aSesion(await apiFetch<SessionBackend>("/auth/session"));
  },

  async listWorkers(): Promise<WorkerAdmin[]> {
    const workers = await apiFetch<(SessionBackend & { activo: boolean })[]>(
      "/trabajadores",
    );
    return workers.map((w) => ({ ...aSesion(w), activo: w.activo }));
  },

  async createWorker(input: {
    usuario: string;
    nombre: string;
    password: string;
    rol: RolUi;
  }): Promise<WorkerAdmin> {
    const res = await apiFetch<SessionBackend & { activo: boolean }>(
      "/trabajadores",
      {
        method: "POST",
        body: JSON.stringify({
          usuario: input.usuario.toLowerCase().trim(),
          nombre: input.nombre.trim(),
          password: input.password,
          rol: ROL_BACKEND_POR_UI[input.rol] as Rol,
        }),
      },
    );
    return { ...aSesion(res), activo: res.activo };
  },

  async setWorkerActivo(usuario: string, activo: boolean): Promise<WorkerAdmin> {
    const res = await apiFetch<SessionBackend & { activo: boolean }>(
      `/trabajadores/${encodeURIComponent(usuario)}/activo`,
      { method: "PATCH", body: JSON.stringify({ activo }) },
    );
    return { ...aSesion(res), activo: res.activo };
  },
};
