import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { soles } from "@/lib/pizzas";

export function FloatingCart() {
  const { items, count, subtotal, setQty, remove } = useCart();
  const [open, setOpen] = useState(false);

  if (count === 0 && !open) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-semibold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105"
        aria-label="Abrir carrito"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="hidden sm:inline">{soles(subtotal)}</span>
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-brand-black">
          {count}
        </span>
      </button>

      {/* Bottom sheet (móvil) / panel lateral (desktop) */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-brand-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card p-5 sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tu carrito</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tu carrito está vacío. ¡Agrega una pizza!
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-3 rounded-2xl border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.tamano} · {soles(item.precio)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setQty(item.key, item.qty - 1)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted"
                          aria-label="Quitar uno"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => setQty(item.key, item.qty + 1)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted"
                          aria-label="Agregar uno"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(item.key)}
                          className="grid h-8 w-8 place-items-center rounded-full text-primary"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-bold">{soles(subtotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className="btn-tactile mt-4 flex w-full items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary/90"
                >
                  Ir a pagar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
