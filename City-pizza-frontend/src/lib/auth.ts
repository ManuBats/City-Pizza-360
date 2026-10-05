/**
 * Módulo Auth (vista SPA) — frontera del monolito para trabajadores.
 *
 * MOCK TEMPORAL con los mismos usuarios demo de Lovable (admin/city360, etc.).
 * TODO(módulo Auth backend): reemplazar el cuerpo de cada función por fetch a
 *   POST ${VITE_API_URL}/auth/login  (retorna { token, usuario, nombre, rol })
 *   GET  ${VITE_API_URL}/auth/session (header Authorization: Bearer <token>)
 *   POST ${VITE_API_URL}/auth/logout
 *   y admin/* para gestión de usuarios. La UI (login, RequireRole) no cambia.
 */
import { getWorkerToken, setWorkerToken } from "./worker-token";

export type Rol = "admin" | "cajero" | "cocina" | "delivery" | "mesero";

export const ROLES: Rol[] = ["admin", "cajero", "cocina", "delivery", "mesero"];

export type WorkerSession = { usuario: string; nombre: string; rol: Rol };

type StoredUser = WorkerSession & { password: string; activo: boolean };

const DEMO_USERS: StoredUser[] = [
  { usuario: "admin", nombre: "Administrador", rol: "admin", password: "city360", activo: true },
  { usuario: "cajero", nombre: "Caja Turno Noche", rol: "cajero", password: "caja123", activo: true },
  { usuario: "cocina", nombre: "Cocina Principal", rol: "cocina", password: "cocina123", activo: true },
  { usuario: "delivery", nombre: "José Ramírez", rol: "delivery", password: "moto123", activo: true },
  { usuario: "mesero", nombre: "Mesero Salón", rol: "mesero", password: "mesa123", activo: true },
];

function fakeToken(usuario: string): string {
  return `mock.${btoa(usuario)}.${Date.now()}`;
}

function sessionFromToken(token: string | null): WorkerSession | null {
  if (!token || !token.startsWith("mock.")) return null;
  try {
    const usuario = atob(token.split(".")[1] ?? "");
    const user = DEMO_USERS.find((u) => u.usuario === usuario && u.activo);
    if (!user) return null;
    return { usuario: user.usuario, nombre: user.nombre, rol: user.rol };
  } catch {
    return null;
  }
}

export async function loginWorker(
  usuario: string,
  password: string,
): Promise<(WorkerSession & { token: string }) | null> {
  const user = DEMO_USERS.find(
    (u) => u.usuario === usuario.toLowerCase().trim() && u.activo,
  );
  if (!user || user.password !== password) return null;
  const token = fakeToken(user.usuario);
  setWorkerToken(token);
  return { usuario: user.usuario, nombre: user.nombre, rol: user.rol, token };
}

export async function getWorkerSession(): Promise<WorkerSession | null> {
  return sessionFromToken(getWorkerToken());
}

export async function logoutWorker(): Promise<void> {
  setWorkerToken(null);
}

/* ---------- Gestión de usuarios (solo admin) ---------- */
// TODO(módulo Auth backend): GET/POST ${VITE_API_URL}/admin/workers con JWT rol admin.

export type WorkerAdmin = WorkerSession & { activo: boolean };

const EXTRA_USERS_KEY = "citypizza360-extra-workers";

function extraUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(EXTRA_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function saveExtraUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(EXTRA_USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

function allUsers(): StoredUser[] {
  return [...DEMO_USERS, ...extraUsers()];
}

async function requireAdmin(): Promise<WorkerSession> {
  const session = await getWorkerSession();
  if (!session || session.rol !== "admin") throw new Error("Forbidden");
  return session;
}

export async function listWorkers(): Promise<WorkerAdmin[]> {
  await requireAdmin();
  return allUsers().map(({ password: _p, ...u }) => u);
}

const USUARIO_RE = /^[a-z0-9._-]+$/;

export async function createWorker(input: {
  usuario: string;
  nombre: string;
  password: string;
  rol: Rol;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const usuario = input.usuario.toLowerCase().trim();
  if (usuario.length < 3 || usuario.length > 30 || !USUARIO_RE.test(usuario))
    return { ok: false, error: "Usuario en minúsculas, mín. 3 caracteres (punto, guion y guion bajo)." };
  if (!input.nombre.trim() || input.nombre.trim().length > 60)
    return { ok: false, error: "Ingresa el nombre completo." };
  if (input.password.length < 4 || input.password.length > 60)
    return { ok: false, error: "Contraseña de 4+ caracteres." };
  if (!ROLES.includes(input.rol)) return { ok: false, error: "Rol inválido." };
  if (allUsers().some((u) => u.usuario === usuario))
    return { ok: false, error: "Ese usuario ya existe." };
  saveExtraUsers([
    ...extraUsers(),
    { usuario, nombre: input.nombre.trim(), rol: input.rol, password: input.password, activo: true },
  ]);
  return { ok: true };
}

export async function setWorkerActivo(
  usuario: string,
  activo: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (usuario === "admin" && !activo)
    return { ok: false, error: "No puedes desactivar al admin." };
  const demo = DEMO_USERS.find((u) => u.usuario === usuario);
  if (demo) {
    demo.activo = activo;
    return { ok: true };
  }
  const extras = extraUsers();
  const target = extras.find((u) => u.usuario === usuario);
  if (!target) return { ok: false, error: "Usuario no encontrado." };
  target.activo = activo;
  saveExtraUsers(extras);
  return { ok: true };
}
