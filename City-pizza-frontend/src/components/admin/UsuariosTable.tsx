import { Users } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ROL_LABEL_UI } from "@/types/trabajador";
import { useUsuarios } from "@/hooks/use-usuarios";

type WorkerRow = ReturnType<typeof useUsuarios>["workers"][number];

interface UsuariosTableProps {
  workers: WorkerRow[];
  cargando: boolean;
  alternando: boolean;
  onToggle: (usuario: string, activo: boolean) => void;
}

/** Tabla del equipo (extraída de app/(interno)/admin/usuarios/page.tsx). */
export function UsuariosTable({ workers, cargando, alternando, onToggle }: UsuariosTableProps) {
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
              @{w.usuario} · {ROL_LABEL_UI[w.rol]}
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
          onClick={() => onToggle(w.usuario, !w.activo)}
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
    <section className="card-soft h-fit p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Users className="h-5 w-5 text-primary" /> Equipo
      </h2>
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={workers}
          rowKey={(w) => w.usuario}
          loading={cargando}
          loadingText="Cargando equipo…"
          emptyText="Sin trabajadores registrados"
        />
      </div>
    </section>
  );
}
