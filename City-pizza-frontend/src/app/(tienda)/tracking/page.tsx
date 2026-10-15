import { useState } from "react";
import {
  Check,
  ChefHat,
  ClipboardCheck,
  Clock,
  Loader2,
  PackageCheck,
  Pizza,
  Search,
  Truck,
  User,
} from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { useTrackingReal, leerUltimoPedido } from "@/hooks/use-tracking";
import { LOCAL, soles } from "@/lib/pizzas";

const PASOS = [
  { id: "recibido", label: "Recibido", icon: ClipboardCheck },
  { id: "confirmado", label: "Confirmado", icon: Check },
  { id: "preparacion", label: "En Preparación", icon: ChefHat },
  { id: "listo", label: "Listo", icon: PackageCheck },
  { id: "camino", label: "En Camino", icon: Truck },
  { id: "entregado", label: "Entregado", icon: Pizza },
] as const;

function minutosDesde(fechaIso: string): number {
  const ms = Date.now() - new Date(fechaIso).getTime();
  return Math.max(0, Math.floor(ms / 60_000));
}

export function TrackingPage() {
  const { codigo: codigoUrl, celular: celularUrl } = useSearch({ from: "/tracking" });
  // Fallback: último pedido de este dispositivo (sobrevive recargas).
  const guardado = !codigoUrl && !celularUrl ? leerUltimoPedido() : null;
  const codigo = codigoUrl ?? guardado?.codigo;
  const celular = celularUrl ?? guardado?.celular;
  const navigate = useNavigate({ from: "/tracking" });
  const { pedido, pasoActual, cargando, error, buscar } = useTrackingReal(codigo, celular);

  const [codigoInput, setCodigoInput] = useState(codigo ?? "");
  const [celularInput, setCelularInput] = useState(celular ?? "");

  function onBuscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate({
      search: {
        codigo: codigoInput.trim().toUpperCase() || undefined,
        celular: celularInput.replace(/\D/g, "").slice(0, 9) || undefined,
      },
    });
  }

  const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(LOCAL.mapsQuery)}&output=embed`;

  return (
    <TiendaLayout>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Buscador código + celular */}
        <form
          onSubmit={onBuscar}
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

        {!buscar && (
          <div className="card-soft mt-6 p-8 text-center">
            <Pizza className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 font-extrabold">Sigue tu pedido en vivo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresa el código que recibiste al confirmar y tu celular.
            </p>
            {guardado && (
              <button
                onClick={() =>
                  navigate({ search: { codigo: guardado.codigo, celular: guardado.celular } })
                }
                className="btn-tactile mt-4 inline-flex items-center bg-primary px-6 text-white transition-colors hover:bg-primary/90"
              >
                Ver mi último pedido ({guardado.codigo})
              </button>
            )}
          </div>
        )}

        {buscar && cargando && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Buscando tu pedido…
          </p>
        )}
        {buscar && error && !cargando && (
          <p className="card-soft mt-6 p-4 text-center text-sm font-semibold text-primary">
            {error} Revisa el código y el celular.
          </p>
        )}

        {pedido && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">
                  Pedido {pedido.codigo}
                  <button
                    onClick={() => void navigator.clipboard?.writeText(pedido.codigo).catch(() => {})}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
                    title="Copiar código"
                  >
                    Copiar código
                  </button>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pedido.detalles.map((d) => `${d.cantidad}× ${d.pizza.nombre}`).join(", ")} ·{" "}
                  {soles(Number(pedido.total))}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-brand-black">
                <Clock className="h-4 w-4" /> Hace {minutosDesde(pedido.creadoEn)} min
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

            {/* Repartidor real o pendiente de asignación */}
            <section className="card-soft mt-6 flex items-center gap-4 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-black text-lg font-bold text-secondary">
                {pedido.repartidor
                  ? pedido.repartidor.nombre
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : <User className="h-6 w-6" />}
              </span>
              <div className="min-w-0 flex-1">
                {pedido.repartidor ? (
                  <>
                    <p className="font-bold">{pedido.repartidor.nombre}</p>
                    <p className="text-sm text-muted-foreground">Tu repartidor asignado</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Repartidor aún no asignado</p>
                    <p className="text-sm text-muted-foreground">
                      La cocina lo asignará cuando tu pedido esté listo.
                    </p>
                  </>
                )}
              </div>
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
