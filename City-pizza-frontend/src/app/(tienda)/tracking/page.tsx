import { useState } from "react";
import {
  Check,
  ChefHat,
  ClipboardCheck,
  Clock,
  Loader2,
  PackageCheck,
  Phone,
  Pizza,
  Search,
  Truck,
} from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { useTrackingReal, useTrackingSimulado } from "@/hooks/use-tracking";
import { LOCAL, soles } from "@/lib/pizzas";

export function TrackingPage() {
  const { codigo, celular } = useSearch({ from: "/tracking" });
  const navigate = useNavigate({ from: "/tracking" });
  const real = useTrackingReal(codigo, celular);
  const sim = useTrackingSimulado();

  const [codigoInput, setCodigoInput] = useState(codigo ?? "");
  const [celularInput, setCelularInput] = useState(celular ?? "");

  function buscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate({
      search: {
        codigo: codigoInput.trim() || undefined,
        celular: celularInput.replace(/\D/g, "").slice(0, 9) || undefined,
      },
    });
  }

  const PASOS = [
    { id: "recibido", label: "Recibido", icon: ClipboardCheck },
    { id: "confirmado", label: "Confirmado", icon: Check },
    { id: "preparacion", label: "En Preparación", icon: ChefHat },
    { id: "listo", label: "Listo", icon: PackageCheck },
    { id: "camino", label: "En Camino", icon: Truck },
    { id: "entregado", label: "Entregado", icon: Pizza },
  ] as const;

  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(LOCAL.mapsQuery)}&output=embed`;

  // Sin búsqueda: demo visual (mock). Con búsqueda: datos reales del backend.
  const pasoActual = real.buscar ? real.pasoActual : sim.pasoActual;
  const titulo = real.buscar && real.pedido ? `Pedido ${real.pedido.codigo}` : "Pedido #0125";
  const totalLinea =
    real.buscar && real.pedido
      ? `${real.pedido.detalles.map((d) => `${d.cantidad}× ${d.pizza.nombre}`).join(", ")} · ${soles(Number(real.pedido.total))}`
      : "Gracias por tu compra. Aquí va tu pizza.";

  return (
    <TiendaLayout>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Buscador código + celular */}
        <form
          onSubmit={buscar}
          className="card-soft flex flex-col gap-2 p-4 sm:flex-row"
        >
          <input
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="Código (ej. CP360-1234)"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={celularInput}
            onChange={(e) => setCelularInput(e.target.value.replace(/\D/g, "").slice(0, 9))}
            inputMode="numeric"
            placeholder="Celular (9 dígitos)"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="btn-tactile inline-flex items-center justify-center gap-2 bg-primary px-6 text-white transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>

        {real.buscar && real.cargando && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Buscando tu pedido…
          </p>
        )}
        {real.buscar && real.error && !real.cargando && (
          <p className="card-soft mt-6 p-4 text-center text-sm font-semibold text-primary">
            {real.error} Revisa el código y el celular.
          </p>
        )}

        {(!real.buscar || real.pedido) && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold">{titulo}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{totalLinea}</p>
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
          </>
        )}
      </main>
    </TiendaLayout>
  );
}
