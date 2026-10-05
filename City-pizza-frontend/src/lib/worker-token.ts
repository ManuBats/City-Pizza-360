/** Copia del JWT de trabajador en el navegador, enviada como header Authorization. */
const KEY = "cp360_worker_token";

export function getWorkerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setWorkerToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}
