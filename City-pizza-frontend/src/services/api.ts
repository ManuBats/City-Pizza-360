import { getWorkerToken } from "@/lib/worker-token";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url) throw new Error("VITE_API_URL no está definida en .env");
  return url.replace(/\/$/, "");
}

/**
 * Única función que toca red en todo el frontend.
 * Inyecta el JWT de trabajador y avisa con `session:expired` ante 401
 * para que la sesión global haga logout.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getWorkerToken();
  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      message: "Error inesperado del servidor",
    }))) as { message?: string };
    const error = new ApiError(
      typeof body.message === "string" ? body.message : "Error inesperado del servidor",
      res.status,
      body,
    );
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("session:expired", { detail: error }));
    }
    throw error;
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
