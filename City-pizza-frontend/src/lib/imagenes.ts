/**
 * Las URLs que devuelve el backend (/uploads/...) son relativas a la API,
 * no al frontend. Esta función las vuelve absolutas para que el navegador
 * las pida a http://localhost:3000 (o al Render/Supabase de producción).
 */
export function urlPublica(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const base = ((import.meta.env.VITE_API_URL as string | undefined) || "").replace(/\/$/, "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
