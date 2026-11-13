import { useState } from "react";
import { useSessionContext } from "@/context/session-context";
import { ApiError, esErrorDeRed } from "@/services/api";

// Lógica de login extraída de app/(interno)/login/page.tsx (como use-login de CCA).
export function useLogin() {
  const { login } = useSessionContext();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await login(
        String(form.get("usuario") ?? ""),
        String(form.get("password") ?? ""),
      );
      if (!res) {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        const seconds = (e.data as { retryAfterSeconds?: unknown } | null)
          ?.retryAfterSeconds;
        const wait =
          typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
            ? Math.ceil(seconds)
            : 60;
        setError(
          `Demasiados intentos. Espera ${wait} segundos antes de volver a intentarlo.`,
        );
        return;
      }
      setError(
        esErrorDeRed(e)
          ? "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo."
          : "No se pudo iniciar sesión. Intenta de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  }

  return { error, cargando, onSubmit };
}
