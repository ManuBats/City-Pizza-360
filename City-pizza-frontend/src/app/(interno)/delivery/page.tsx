import { Bike, CheckCircle2 } from "lucide-react";
import { RequireRole } from "@/components/worker/worker-auth";
import { DeliveryCard } from "@/components/delivery/DeliveryCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StaffLayout } from "@/app/layouts/StaffLayout";
import { useEntregas } from "@/hooks/use-entregas";

/** Solo delivery (y admin) con JWT válido; el resto ve 403. */
export default function DeliveryPage() {
  return (
    <RequireRole roles={["delivery", "admin"]}>
      <DeliveryContenido />
    </RequireRole>
  );
}

function DeliveryContenido() {
  const { activas, cargando, errorEntregas, reintentar, avanzar } = useEntregas();

  return (
    <StaffLayout
      icon={<Bike className="h-5 w-5 text-white" />}
      title="Mis Entregas"
      subtitle="Turno noche · City Pizza Center"
      badge={
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand-black">
          {activas.length} pendientes
        </span>
      }
    >
      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {errorEntregas && activas.length === 0 && (
          <ErrorBanner mensaje={errorEntregas} onReintentar={() => void reintentar()} />
        )}
        {cargando && activas.length === 0 && !errorEntregas && (
          <div className="card-soft py-12 text-center">
            <p className="mt-3 font-extrabold">Cargando entregas…</p>
          </div>
        )}
        {activas.map((e) => (
          <DeliveryCard key={e.id} entrega={e} onAvanzar={avanzar} />
        ))}

        {!cargando && !errorEntregas && activas.length === 0 && (
          <div className="card-soft py-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-extrabold">¡Todo entregado!</p>
            <p className="text-sm text-muted-foreground">Vuelve al local por más pedidos.</p>
          </div>
        )}
      </main>
    </StaffLayout>
  );
}
