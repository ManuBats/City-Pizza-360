import { Link } from "@tanstack/react-router";

/** Link discreto al acceso de trabajadores — solo en el footer de páginas de cliente. */
export function WorkerAccessLink() {
  return (
    <div className="mt-6 text-right">
      <Link
        to="/login"
        className="text-xs text-white/40 underline-offset-2 transition-colors hover:text-white/70 hover:underline"
      >
        ¿Eres trabajador? Acceso interno
      </Link>
    </div>
  );
}
