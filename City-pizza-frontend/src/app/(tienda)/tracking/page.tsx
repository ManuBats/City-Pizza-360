import {
  Check,
  ChefHat,
  ClipboardCheck,
  Clock,
  PackageCheck,
  Phone,
  Pizza,
  Truck,
} from "lucide-react";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { useTrackingSimulado } from "@/hooks/use-tracking";
import { LOCAL } from "@/lib/pizzas";

export function TrackingPage() {
  // Mock temporal. TODO(Fase B): código + celular + polling 10s real.
  const { pasoActual } = useTrackingSimulado();
  const PASOS = [
    { id: "recibido", label: "Recibido", icon: ClipboardCheck },
    { id: "confirmado", label: "Confirmado", icon: Check },
    { id: "preparacion", label: "En Preparación", icon: ChefHat },
    { id: "listo", label: "Listo", icon: PackageCheck },
    { id: "camino", label: "En Camino", icon: Truck },
    { id: "entregado", label: "Entregado", icon: Pizza },
  ] as const;

  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(LOCAL.mapsQuery)}&output=embed`;

  return (
    <TiendaLayout>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Pedido #0125</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gracias por tu compra. Aquí va tu pizza.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-brand-black">
            <Clock className="h-4 w-4" /> Tiempo estimado: 25–35 min
          </span>
        </div>

        {/* Timeline */}
        <section className="card-soft mt-6 p-6">
          <ol className="space-y-0">
            {PASOS.map((paso, i) => {
              const Icon = paso.icon;
              const done = i < pasoActual;
              const active = i === pasoActual;
              return (
                <li key={paso.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < PASOS.length - 1 && (
                    <span
                      className={`absolute left-5 top-10 h-full w-0.5 ${
                        done ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <span
                    className={`z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : done
                          ? "bg-secondary text-brand-black"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="pt-2">
                    <p
                      className={`font-semibold ${
                        active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {paso.label}
                    </p>
                    {active && (
                      <p className="text-xs text-muted-foreground">
                        Estado actual de tu pedido
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Repartidor */}
        <section className="card-soft mt-6 flex items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-black text-lg font-bold text-secondary">
            JR
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">José Ramírez</p>
            <p className="text-sm text-muted-foreground">Tu repartidor · Moto roja ABC-123</p>
          </div>
          <a
            href="tel:+51987654321"
            className="btn-tactile inline-flex shrink-0 items-center gap-2 bg-primary px-5 text-sm text-white"
          >
            <Phone className="h-4 w-4" /> Llamar
          </a>
        </section>

        {/* Mapa referencial */}
        <section className="card-soft mt-6 overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="font-bold">Mapa referencial</h2>
            <p className="text-sm text-muted-foreground">{LOCAL.direccion}</p>
          </div>
          <iframe
            title="Mapa de City Pizza Center"
            src={mapsUrl}
            className="h-72 w-full border-0"
            loading="lazy"
          />
        </section>
      </main>
    </TiendaLayout>
  );
}
