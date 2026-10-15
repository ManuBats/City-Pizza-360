import { Bell, Flame } from "lucide-react";
import { RequireRole } from "@/components/worker/worker-auth";
import { TicketKds } from "@/components/cocina/TicketKds";
import { StaffLayout } from "@/app/layouts/StaffLayout";
import { useCola } from "@/hooks/use-cola";

/** Solo cocina (y admin) con JWT válido; el resto ve 403. */
export default function CocinaPage() {
  return (
    <RequireRole roles={["cocina", "admin"]}>
      <CocinaContenido />
    </RequireRole>
  );
}

function CocinaContenido() {
  const { tickets, ahora, nuevos, preparando, cargando, repartidores, iniciar, marcarListo, asignar } = useCola();

  return (
    <StaffLayout
      tone="dark"
      icon={<Flame className="h-5 w-5 text-white" />}
      title="Cocina — KDS"
      subtitle="City Pizza Center · actualiza cada 3s"
      badge={
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
          <Bell className="h-4 w-4 text-secondary" />
          {tickets.length} activas
        </div>
      }
    >
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-2 xl:grid-cols-3">
        {cargando && tickets.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <p className="text-2xl font-extrabold text-white/80">Cargando comandas…</p>
          </div>
        )}
        {tickets.map((t) => (
          <TicketKds
            key={t.id}
            ticket={t}
            ahora={ahora}
            repartidores={repartidores}
            onIniciar={iniciar}
            onListo={marcarListo}
            onAsignar={asignar}
          />
        ))}

        {!cargando && tickets.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <p className="text-2xl font-extrabold text-white/80">Sin comandas activas</p>
            <p className="mt-1 text-sm text-white/50">Las nuevas aparecerán aquí automáticamente.</p>
          </div>
        )}
      </main>

      {/* Resumen fijo inferior */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-brand-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-3 text-sm font-bold">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-secondary" /> Nuevas: {nuevos.length}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" /> Preparando: {preparando.length}
          </span>
        </div>
      </footer>
    </StaffLayout>
  );
}
