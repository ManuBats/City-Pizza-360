import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LogoutButton, RequireRole, type Rol } from "@/components/worker-auth";
import { createWorker, listWorkers, setWorkerActivo } from "@/lib/auth";

const ROLES: { value: Rol; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "cajero", label: "Cajero" },
  { value: "cocina", label: "Cocina" },
  { value: "delivery", label: "Delivery" },
  { value: "mesero", label: "Mesero" },
];

const ROL_LABEL: Record<Rol, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
) as Record<Rol, string>;

export default function UsuariosPage() {
  return (
    <RequireRole roles={["admin"]}>
      <UsuariosContent />
    </RequireRole>
  );
}

function UsuariosContent() {
  const queryClient = useQueryClient();

  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => listWorkers(),
  });

  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("cajero");
  const [error, setError] = useState<string | null>(null);

  const crear = useMutation({
    mutationFn: () => createWorker({ usuario, nombre, password, rol }),
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.error ?? "No se pudo crear el usuario.");
        return;
      }
      setError(null);
      setUsuario("");
      setNombre("");
      setPassword("");
      setRol("cajero");
      void queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
    onError: () => setError("Revisa los datos: usuario en minúsculas (mín. 3) y contraseña de 4+ caracteres."),
  });

  const toggle = useMutation({
    mutationFn: (input: { usuario: string; activo: boolean }) =>
      setWorkerActivo(input.usuario, input.activo),
    onSuccess: (res) => {
      if (!res.ok) setError(res.error ?? "No se pudo actualizar.");
      else setError(null);
      void queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    crear.mutate();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al panel
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold">Usuarios internos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo el admin crea cuentas. Entrega la contraseña temporal al trabajador.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Lista */}
          <section className="card-soft h-fit p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Users className="h-5 w-5 text-primary" /> Equipo
            </h2>
            {isLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {(workers ?? []).map((w) => (
                  <li
                    key={w.usuario}
                    className={`flex items-center gap-3 rounded-2xl border border-border p-3 ${
                      w.activo ? "" : "opacity-60"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-black text-sm font-bold text-secondary">
                      {w.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{w.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        @{w.usuario} · {ROL_LABEL[w.rol]}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        w.activo ? "bg-secondary text-brand-black" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {w.activo ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      onClick={() => toggle.mutate({ usuario: w.usuario, activo: !w.activo })}
                      disabled={toggle.isPending}
                      className={`btn-tactile min-h-9 shrink-0 rounded-xl px-3 text-xs font-bold transition-colors disabled:opacity-50 ${
                        w.activo
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-secondary text-brand-black hover:bg-secondary/90"
                      }`}
                    >
                      {w.activo ? "Desactivar" : "Activar"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Crear */}
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
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm font-semibold text-primary">{error}</p>}
              <button
                type="submit"
                disabled={crear.isPending}
                className="btn-tactile flex w-full items-center justify-center gap-2 bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
