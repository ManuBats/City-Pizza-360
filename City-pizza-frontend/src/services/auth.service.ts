import { apiFetch } from "./api";
import type { LoginResponse, WorkerAdmin, WorkerSession } from "@/types/trabajador";
import type { Rol } from "@/types/trabajador";

/** Módulo Auth + gestión de trabajadores (solo admin). */
export const AuthService = {
  async login(usuario: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario: usuario.trim(), password }),
    });
  },

  async me(): Promise<WorkerSession> {
    return apiFetch<WorkerSession>("/auth/session");
  },

  async listWorkers(): Promise<WorkerAdmin[]> {
    return apiFetch<WorkerAdmin[]>("/trabajadores");
  },

  async createWorker(input: {
    usuario: string;
    nombre: string;
    password: string;
    rol: Rol;
  }): Promise<WorkerAdmin> {
    return apiFetch<WorkerAdmin>("/trabajadores", {
      method: "POST",
      body: JSON.stringify({
        usuario: input.usuario.toLowerCase().trim(),
        nombre: input.nombre.trim(),
        password: input.password,
        rol: input.rol,
      }),
    });
  },

  async setWorkerActivo(usuario: string, activo: boolean): Promise<WorkerAdmin> {
    return apiFetch<WorkerAdmin>(
      `/trabajadores/${encodeURIComponent(usuario)}/activo`,
      { method: "PATCH", body: JSON.stringify({ activo }) },
    );
  },
};
