import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { LogoutButton, RequireRole, type Rol } from "@/components/worker/worker-auth";
import { useUsuarios } from "@/hooks/use-usuarios";

type WorkerRow = ReturnType<typeof useUsuarios>["workers"][number];

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
  const {
    workers, cargando: isLoading, error, setError,
    crear, creando, toggle, alternando,
  } = useUsuarios();

  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("cajero");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    crear({ usuario, nombre, password, rol });
    setUsuario("");
    setNombre("");
    setPassword("");
    setRol("cajero");
  }

  const columns: DataTableColumn<WorkerRow>[] = [
    {
      key: "nombre",
      header: "Trabajador",
      render: (w) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-black text-sm font-bold text-secondary">
            {w.nombre.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{w.nombre}</p>
            <p className="text-xs text-muted-foreground">
              @{w.usuario} · {ROL_LABEL[w.rol]}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      render: (w) => (
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            w.activo ? "bg-secondary text-brand-black" : "bg-muted text-muted-foreground"
          }`}
        >
          {w.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "text-right",
      render: (w) => (
        <button
          onClick={() => toggle({ usuario: w.usuario, activo: !w.activo })}
          disabled={alternando}
          className={`btn-tactile min-h-9 shrink-0 rounded-xl px-3 text-xs font-bold transition-colors disabled:opacity-50 ${
            w.activo
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary text-brand-black hover:bg-secondary/90"
          }`}
        >
          {w.activo ? "Desactivar" : "Activar"}
        </button>
      ),
    },
  ];

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
            <div className="mt-4">
              <DataTable
                columns={columns}
                data={workers}
                rowKey={(w) => w.usuario}
                loading={isLoading}
                loadingText="Cargando equipo…"
                emptyText="Sin trabajadores registrados"
              />
            </div>
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
                disabled={creando}
                className="btn-tactile flex w-full items-center justify-center gap-2 bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {creando && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
