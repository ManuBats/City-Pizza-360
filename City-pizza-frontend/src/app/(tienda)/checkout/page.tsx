import { Link } from "@tanstack/react-router";
import { Banknote, Minus, Phone, Plus, QrCode, Trash2 } from "lucide-react";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { YapeModal } from "@/components/checkout/YapeModal";
import { useCheckout } from "@/hooks/use-checkout";
import { COSTO_DELIVERY, soles } from "@/lib/pizzas";

export function CheckoutPage() {
  const {
    items, subtotal, total, esDelivery, errores, enviando,
    nombres, apellidos, celular, direccion, referencia, entrega, metodoPago,
    confirmado,
    setNombres, setApellidos, setCelular, setDireccion, setReferencia,
    setEntrega, setMetodoPago,
    setQty, setNota, setExtraQueso, remove, confirmar, irATracking,
  } = useCheckout();
  const esYape = metodoPago === "Yape";

  return (
    <TiendaLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">Tu Pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sin registro ni contraseña. Solo necesitamos tus datos para entregar.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Items */}
          <section className="card-soft p-5">
            <h2 className="font-bold">Productos</h2>
            {errores.items && (
              <p className="mt-2 text-sm font-medium text-primary">{errores.items}</p>
            )}
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Aún no agregas nada. ¡El horno ya está caliente!
                </p>
                <Link
                  to="/menu"
                  search={{ categoria: undefined }}
                  className="btn-tactile mt-4 inline-flex items-center bg-primary px-6 text-white"
                >
                  Ver Menú
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-2xl border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.tamano} · {soles(item.precio)} c/u
                          {item.extraQueso ? " · +queso" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setQty(item.key, item.qty - 1)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                          aria-label="Quitar uno"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center font-bold">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.key, item.qty + 1)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                          aria-label="Agregar uno"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(item.key)}
                          className="grid h-9 w-9 place-items-center rounded-full text-primary"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="w-16 shrink-0 text-right font-bold">
                        {soles(item.precio * item.qty)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        value={item.nota ?? ""}
                        onChange={(e) => setNota(item.key, e.target.value)}
                        placeholder="Nota para esta pizza (ej. sin aceitunas)"
                        maxLength={200}
                        className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={item.extraQueso === true}
                          onChange={(e) => setExtraQueso(item.key, e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Extra queso (+S/3)
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Formulario de pago */}
          <aside className="card-soft h-fit p-5">
            <h2 className="font-bold">Datos de entrega</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Nombres</label>
                <input
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Manuel"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {errores.nombres && (
                  <p className="mt-1 text-xs font-medium text-primary">{errores.nombres}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Apellidos</label>
                <input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Sánchez Ríos"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {errores.apellidos && (
                  <p className="mt-1 text-xs font-medium text-primary">{errores.apellidos}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Celular (9 dígitos)</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:border-primary">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={celular}
                    onChange={(e) =>
                      setCelular(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    inputMode="numeric"
                    placeholder="987654321"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                {errores.celular && (
                  <p className="mt-1 text-xs font-medium text-primary">{errores.celular}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de entrega</label>
                <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  <button
                    onClick={() => setEntrega("delivery")}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      esDelivery ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >
                    Delivery (+{soles(COSTO_DELIVERY)})
                  </button>
                  <button
                    onClick={() => setEntrega("recojo")}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      !esDelivery ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >
                    Recojo en tienda
                  </button>
                </div>
              </div>

              {esDelivery && (
                <>
                  <div>
                    <label className="text-sm font-medium">Dirección de entrega</label>
                    <input
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej. Jr. Grau 123, San Vicente"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    {errores.direccion && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {errores.direccion}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Referencia <span className="text-muted-foreground">(opcional)</span>
                    </label>
                    <input
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Ej. Frente al parque, puerta negra"
                      className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium">Método de pago</label>
                <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  <button
                    onClick={() => setMetodoPago("Efectivo")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      !esYape ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >
                    <Banknote className="h-4 w-4" /> Efectivo
                  </button>
                  <button
                    onClick={() => setMetodoPago("Yape")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      esYape ? "bg-primary text-white" : "text-muted-foreground"
                    }`}
                  >
                    <QrCode className="h-4 w-4" /> Yape
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-muted p-3">
                {esYape ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <QrCode className="h-4 w-4 text-primary" /> Pago con Yape
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Al confirmar verás el QR del local y subirás tu captura.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Banknote className="h-4 w-4 text-primary" /> Pago en efectivo
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pagas al recibir tu pedido. Ten el monto exacto si puedes.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{soles(subtotal)}</span>
                </div>
                {esDelivery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold">{soles(COSTO_DELIVERY)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-primary">{soles(total)}</span>
                </div>
              </div>

              <button
                onClick={() => void confirmar()}
                disabled={enviando}
                className="btn-tactile w-full bg-primary text-base text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                Confirmar Pedido · {soles(total)}
              </button>
            </div>
          </aside>
        </div>
      </main>

      {confirmado?.requiereYape && (
        <YapeModal
          pedido={confirmado.pedido}
          onSubido={(pedido) => void irATracking(pedido)}
          onOmitir={() => void irATracking(confirmado.pedido)}
        />
      )}
    </TiendaLayout>
  );
}
