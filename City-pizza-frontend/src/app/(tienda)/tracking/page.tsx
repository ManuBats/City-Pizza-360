import { useEffect, useState } from "react";
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
import { useTrackingReal, leerUltimoPedido, olvidarUltimoPedido } from "@/hooks/use-tracking";
import { LOCAL, soles } from "@/lib/pizzas";
import { YapeModal } from "@/components/checkout/YapeModal";
import { PedidosService } from "@/services/pedidos.service";
import { AccionesSeguimiento } from "@/components/checkout/AccionesSeguimiento";

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
  const [ultimoPedido, setUltimoPedido] = useState(leerUltimoPedido);
  const guardado = !codigoUrl && !celularUrl ? ultimoPedido : null;
  const navigate = useNavigate({ from: "/tracking" });
  const { pedido, pasoActual, cargando, error, buscar, noEncontrado } = useTrackingReal(codigoUrl, celularUrl);
  const seguimientoGuardado = useTrackingReal(guardado?.codigo, guardado?.celular);

  const [codigoInput, setCodigoInput] = useState("");
  const [celularInput, setCelularInput] = useState("");
  const [adjuntar, setAdjuntar] = useState(false);
  const pasos = pedido?.tipoEntrega === "Delivery" ? PASOS : PASOS.filter((paso) => paso.id !== "camino");
  const indice = pasos.findIndex((paso) => paso.id === PASOS[pasoActual]?.id);

  useEffect(() => {
    const referenciaBorrada = seguimientoGuardado.noEncontrado ? guardado
      : noEncontrado && ultimoPedido?.codigo === codigoUrl && ultimoPedido?.celular === celularUrl
        ? ultimoPedido : null;
    if (referenciaBorrada) {
      olvidarUltimoPedido(referenciaBorrada);
      const actual = leerUltimoPedido();
      setUltimoPedido(actual?.codigo === referenciaBorrada.codigo && actual.celular === referenciaBorrada.celular ? null : actual);
    }
  }, [seguimientoGuardado.noEncontrado, guardado, noEncontrado, ultimoPedido, codigoUrl, celularUrl]);

  useEffect(() => {
    const actualizar = () => setUltimoPedido(leerUltimoPedido());
    window.addEventListener("storage", actualizar);
    return () => window.removeEventListener("storage", actualizar);
  }, []);

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
        <section className="card-soft p-5">
          <h1 className="text-xl font-extrabold">Rastrea tu pedido</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ingresa el código que recibiste al confirmar y tu celular.
          </p>
          <form
            onSubmit={onBuscar}
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          >
            <input
              required
              aria-label="Código del pedido"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
              placeholder="Código (ej. CP360-1234)"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <input
              required
              pattern="9[0-9]{8}"
              aria-label="Celular del pedido"
              value={celularInput}
              onChange={(e) => setCelularInput(e.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              placeholder="Celular (9 dígitos)"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="btn-tactile inline-flex items-center justify-center gap-2 bg-primary px-6 text-white transition-colors hover:bg-primary/90"
            >
              <Search className="h-4 w-4" /> Buscar
            </button>
          </form>
          {guardado && seguimientoGuardado.pedido && !seguimientoGuardado.noEncontrado && (
            <button
              onClick={() =>
                navigate({ search: { codigo: guardado.codigo, celular: guardado.celular } })
              }
              className="mt-3 w-full rounded-xl bg-muted px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/70"
            >
              Continuar seguimiento
            </button>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            ¿Perdiste el código y el enlace? Llama al local al{" "}
            <a className="font-semibold underline" href={`tel:+51${LOCAL.telefono.replace(/\D/g, "")}`}>{LOCAL.telefono}</a>.
          </p>
        </section>

        {!buscar && !guardado && (
          <div className="card-soft mt-6 p-6 text-center">
            <Pizza className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              Aquí verás el estado de tu pizza en vivo: recibida, en cocina, en camino y entregada.
            </p>
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

        {pedido && !noEncontrado && (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">
                  Pedido {pedido.codigo}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pedido.detalles.map((d) => `${d.cantidad}× ${d.promocionNombre ?? d.pizza?.nombre}`).join(", ")} ·{" "}
                  {soles(Number(pedido.total))}
                </p>
                <AccionesSeguimiento pedido={pedido} />
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-brand-black">
                <Clock className="h-4 w-4" /> Hace {minutosDesde(pedido.creadoEn)} min
              </span>
            </div>

            {pedido.metodoPago === "Yape" && pedido.estadoPago === "Pendiente" && pedido.comprobanteUrl && (
              <p className="card-soft mt-4 p-4 text-sm">Caja está revisando tu comprobante Yape.</p>
            )}
            {pedido.comprobanteToken && (
              <button className="btn-tactile mt-4 bg-primary px-4 text-white" onClick={() => setAdjuntar(true)}>
                {pedido.estadoPago === "Rechazado" ? "Reemplazar comprobante rechazado" : "Adjuntar comprobante Yape"}
              </button>
            )}
            {adjuntar && pedido.comprobanteToken && (
              <YapeModal total={pedido.total}
                onConfirmar={(archivo) => PedidosService.subirComprobante(pedido, archivo)}
                onSubido={() => setAdjuntar(false)} onCerrar={() => setAdjuntar(false)}
                reemplazo />
            )}
            {/* Timeline */}
            <section className="card-soft mt-6 p-6">
              <ol className="space-y-0">
                {pasos.map((paso, i) => {
                  const Icon = paso.icon;
                  const done = i < indice;
                  const active = i === indice;
                  return (
                    <li key={paso.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {i < pasos.length - 1 && (
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
            {pedido.tipoEntrega === "Delivery" && <section className="card-soft mt-6 flex items-center gap-4 p-5">
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
            </section>}

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
