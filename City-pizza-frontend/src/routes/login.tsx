import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Pizza, User } from "lucide-react";
import { useState } from "react";
import { loginWorker } from "@/lib/auth";
import { setWorkerToken } from "@/lib/worker-token";

const RUTA_POR_ROL: Record<string, "/admin" | "/cajero" | "/cocina" | "/delivery" | "/mesa"> = {
  admin: "/admin",
  cajero: "/cajero",
  cocina: "/cocina",
  delivery: "/delivery",
  mesero: "/mesa",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await loginWorker(
        String(form.get("usuario") ?? ""),
        String(form.get("password") ?? ""),
      );
      if (!res) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }
      setWorkerToken(res.token);
      queryClient.setQueryData(["worker-session"], {
        usuario: res.usuario,
        nombre: res.nombre,
        rol: res.rol,
      });
      await navigate({ to: RUTA_POR_ROL[res.rol] ?? "/admin", replace: true });
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-brand-black px-4 text-white">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary">
            <Pizza className="h-8 w-8 text-white" />
          </span>
          <p className="mt-4 text-2xl font-extrabold tracking-tight">
            CityPizza<span className="text-secondary">360</span>
          </p>
          <p className="mt-1 text-sm text-white/60">Acceso interno · solo trabajadores</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 text-brand-black">
          <div>
            <label htmlFor="usuario" className="text-sm font-semibold">
              Usuario
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:border-primary">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                id="usuario"
                name="usuario"
                autoComplete="username"
                autoCapitalize="none"
                required
                className="w-full bg-transparent text-sm outline-none"
                placeholder="tu.usuario"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold">
              Contraseña
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:border-primary">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-transparent text-sm outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-primary">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="btn-tactile flex w-full items-center justify-center gap-2 bg-primary text-base text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          ¿No tienes usuario? El administrador te crea uno.{" "}
          <Link to="/" className="underline underline-offset-2 hover:text-white/70">
            Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
