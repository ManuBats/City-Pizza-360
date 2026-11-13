import { Loader2, UserPlus } from "lucide-react";
import { ROLES_UI } from "@/types/trabajador";
import type { useUsuarioForm } from "@/hooks/use-usuario-form";

type Form = ReturnType<typeof useUsuarioForm>;

/** Formulario de alta (extraído de app/(interno)/admin/usuarios/page.tsx). */
export function UsuarioForm({ form }: { form: Form }) {
  const {
    usuario,
    setUsuario,
    nombre,
    setNombre,
    password,
    setPassword,
    passwordError,
    mostrarPassword,
    toggleMostrarPassword,
    rol,
    setRol,
    error,
    creando,
    onSubmit,
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
            Contraseña inicial
          </label>
          <input
            id="nuevo-password"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-describedby={`password-ayuda${passwordError ? " password-error" : ""}`}
            aria-invalid={Boolean(passwordError)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Al menos 12 caracteres"
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={toggleMostrarPassword}
            aria-controls="nuevo-password"
            aria-pressed={mostrarPassword}
            className="mt-2 rounded-lg px-2 py-1 text-sm font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </button>
          <p id="password-ayuda" className="mt-2 text-xs text-muted-foreground">
            Mínimo 12 caracteres y máximo 72 bytes UTF-8. Puedes usar frases con
            espacios, tildes y emojis; estos últimos pueden ocupar varios bytes.
            No se exige combinar mayúsculas, números ni símbolos.
          </p>
          {passwordError && (
            <p
              id="password-error"
              role="alert"
              className="mt-1 text-sm text-primary"
            >
              {passwordError}
            </p>
          )}
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
