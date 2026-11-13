import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, RefreshCw, ShoppingBag, TrendingUp } from "lucide-react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { getErrorMessage } from "@/services/api";
import { ReportesService } from "@/services/operacion.service";
import {
  formatearFecha,
  formatearFechaCorta,
  rangoUltimosDias,
} from "@/lib/fechas";
import { soles } from "@/lib/pizzas";

const ROJO = "#C0392B";
const AMARILLO = "#F1C40F";

const RANGOS = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
];

export function ReportesPanel() {
  const inicial = rangoUltimosDias(7);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [rangoActivo, setRangoActivo] = useState<number | null>(7);

  const rangoInvalido = !desde || !hasta || desde > hasta;

  const ventasQ = useQuery({
    queryKey: ["reportes-ventas", desde, hasta],
    queryFn: () => ReportesService.ventasPorDia({ desde, hasta }),
    enabled: !rangoInvalido,
    retry: 1,
  });
  const topQ = useQuery({
    queryKey: ["reportes-top", desde, hasta],
    queryFn: () => ReportesService.topProductos({ desde, hasta, limit: 5 }),
    enabled: !rangoInvalido,
    retry: 1,
  });

  const ventas = ventasQ.data ?? [];
  const top = topQ.data ?? [];
  const cargando = ventasQ.isLoading || topQ.isLoading;
  const error = ventasQ.error
    ? getErrorMessage(ventasQ.error, "No se pudieron cargar las ventas.")
    : topQ.error
      ? getErrorMessage(topQ.error, "No se pudieron cargar los productos.")
      : null;

  const totalVentas = ventas.reduce((acc, v) => acc + v.ventas, 0);
  const totalPedidos = ventas.reduce((acc, v) => acc + v.pedidos, 0);
  const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
  const hayVentas = ventas.some((v) => v.pedidos > 0 || v.ventas > 0);

  const aplicarRango = (dias: number) => {
    const rango = rangoUltimosDias(dias);
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setRangoActivo(dias);
  };

  const reintentar = () => {
    void ventasQ.refetch();
    void topQ.refetch();
  };

  return (
    <section className="mt-6 space-y-4">
      <div className="card-soft flex flex-wrap items-end gap-3 p-4">
        <div className="mr-auto">
          <h2 className="text-lg font-bold">Reportes de ventas</h2>
          <p className="text-xs text-muted-foreground">
            Días calendario en hora de Lima (UTC−5)
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {RANGOS.map((r) => (
            <button
              key={r.dias}
              onClick={() => aplicarRango(r.dias)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                rangoActivo === r.dias
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className="text-xs font-semibold text-muted-foreground">
          Desde
          <input
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => {
              setDesde(e.target.value);
              setRangoActivo(null);
            }}
            className="mt-1 block rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Hasta
          <input
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => {
              setHasta(e.target.value);
              setRangoActivo(null);
            }}
            className="mt-1 block rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-primary"
          />
        </label>

        <button
          onClick={reintentar}
          disabled={cargando || rangoInvalido}
          className="btn-tactile inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-black px-4 text-sm text-white hover:bg-brand-black/90 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {rangoInvalido && (
        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
          La fecha &quot;desde&quot; no puede ser mayor que &quot;hasta&quot;.
        </p>
      )}

      {error && <ErrorBanner mensaje={error} onReintentar={reintentar} />}

      {cargando && !rangoInvalido && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Cargando reportes…
        </p>
      )}

      {!cargando && !error && !rangoInvalido && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card-soft p-4">
              <Banknote className="h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">{soles(totalVentas)}</p>
              <p className="text-xs text-muted-foreground">Ventas del rango</p>
            </div>
            <div className="card-soft p-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">{totalPedidos}</p>
              <p className="text-xs text-muted-foreground">Pedidos del rango</p>
            </div>
            <div className="card-soft p-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">
                S/{ticketPromedio.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Ticket promedio</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-soft p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold">Ventas por día</h3>
                <span className="text-xs text-muted-foreground">
                  {formatearFecha(desde)} – {formatearFecha(hasta)}
                </span>
              </div>
              {hayVentas ? (
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={ventas}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="ventasGradiente"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={ROJO}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor={ROJO}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e9e2d8"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatearFechaCorta}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(valor) => `S/${valor}`}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={64}
                      />
                      <Tooltip
                        labelFormatter={(label) =>
                          formatearFecha(String(label))
                        }
                        formatter={(valor) => [soles(Number(valor)), "Ventas"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="ventas"
                        name="Ventas"
                        stroke={ROJO}
                        strokeWidth={2.5}
                        fill="url(#ventasGradiente)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EstadoVacio>
                  No hay ventas registradas en este rango. Prueba con otras
                  fechas.
                </EstadoVacio>
              )}
            </div>

            <div className="card-soft p-4">
              <h3 className="font-bold">Top 5 productos</h3>
              <p className="text-xs text-muted-foreground">
                Por cantidad vendida en el rango
              </p>
              {top.length > 0 ? (
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e9e2d8"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={112}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(valor) => [
                          `${Number(valor)} unidades`,
                          "Cantidad",
                        ]}
                      />
                      <Bar
                        dataKey="cantidad"
                        name="Cantidad"
                        fill={AMARILLO}
                        radius={[0, 8, 8, 0]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EstadoVacio>
                  Todavía no hay productos vendidos en este rango.
                </EstadoVacio>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function EstadoVacio({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 grid h-72 place-items-center rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
