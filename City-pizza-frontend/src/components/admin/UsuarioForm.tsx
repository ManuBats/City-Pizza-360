import { Loader2, UserPlus } from "lucide-react";
import { ROLES_UI } from "@/types/trabajador";
import type { useUsuarioForm } from "@/hooks/use-usuario-form";

type Form = ReturnType<typeof useUsuarioForm>;

/** Formulario de alta (extraído de app/(interno)/admin/usuarios/page.tsx). */
export function UsuarioForm({ form }: { form: Form }) {
  const {
    usuario, setUsuario,
    nombre, setNombre,
    password, setPassword,
    rol, setRol,
    error, creando, onSubmit,
  } = form;

  return (
    <form onSubmit={onSubmit} className="card-soft h-fit p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <UserPlus className="h-5 w-5 text-primary" /> Nuevo usuario
      </h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="nuevo-usuario" className="text-sm font-medium">
            Usuario
          </label>
          <input
            id="nuevo-usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.toLowerCase())}
            placeholder="ej. pedro.caja"
            autoCapitalize="none"
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="nuevo-nombre" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="nuevo-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Pedro Salazar"
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="nuevo-password" className="text-sm font-medium">
            Contraseña temporal
          </label>
          <input
            id="nuevo-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 4 caracteres"
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="nuevo-rol" className="text-sm font-medium">
            Rol
          </label>
          <select
            id="nuevo-rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as Form["rol"])}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          >
            {ROLES_UI.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm font-semibold text-primary">{error}</p>}
        <button
          type="submit"
          disabled={creando}
          className="btn-tactile flex w-full items-center justify-center gap-2 bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {creando && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear usuario
        </button>
      </div>
    </form>
  );
}
