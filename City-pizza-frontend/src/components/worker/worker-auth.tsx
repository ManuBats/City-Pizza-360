import { Link } from "@tanstack/react-router";
import { Loader2, LogOut, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { useSessionContext, type Rol } from "@/context/session-context";

export type { Rol };

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-black text-white">
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  );
}

function Forbidden() {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-black px-4 text-white">
      <div className="max-w-sm text-center">
        <ShieldX className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-5xl font-extrabold">403</h1>
        <p className="mt-2 text-lg font-semibold">Acceso restringido</p>
        <p className="mt-1 text-sm text-white/70">
          Esta área es solo para trabajadores de City Pizza Center. Inicia sesión con tu usuario
          interno.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/login"
            className="btn-tactile inline-flex items-center bg-primary px-6 text-white transition-colors hover:bg-primary/90"
          >
            Acceso interno
          </Link>
          <Link
            to="/"
            className="btn-tactile inline-flex items-center border border-white/30 px-6 text-white transition-colors hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Gate por rol: muestra 403 si no hay sesión válida o el rol no corresponde. */
export function RequireRole({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { session, isLoading } = useSessionContext();
  if (isLoading) return <Loading />;
  if (!session || !roles.includes(session.rol)) return <Forbidden />;
  return <>{children}</>;
}

export function LogoutButton({ dark = false }: { dark?: boolean }) {
  const { logout } = useSessionContext();

  return (
    <button
      onClick={() => void logout()}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
        dark
          ? "bg-white/10 text-white/85 hover:bg-white/20 hover:text-white"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      <LogOut className="h-3.5 w-3.5" /> Salir
    </button>
  );
}
