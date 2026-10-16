import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UsuariosTable } from "@/components/admin/UsuariosTable";
import { UsuarioForm } from "@/components/admin/UsuarioForm";
import { RequireRole } from "@/components/worker/worker-auth";
import { useUsuarioForm } from "@/hooks/use-usuario-form";

export default function UsuariosPage() {
  return (
    <RequireRole roles={["admin"]}>
      <UsuariosContent />
    </RequireRole>
  );
}

function UsuariosContent() {
  const form = useUsuarioForm();
  const { workers, cargando, toggle, alternando } = form;

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
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <UsuariosTable
            workers={workers}
            cargando={cargando}
            alternando={alternando}
            onToggle={(usuario, activo) => toggle({ usuario, activo })}
          />
          <UsuarioForm form={form} />
        </div>
      </main>
    </div>
  );
}
