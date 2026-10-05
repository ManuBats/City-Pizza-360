import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { FloatingCart } from "@/components/FloatingCart";
import { WorkerAccessLink } from "@/components/WorkerAccessLink";
import { useCart } from "@/lib/cart";
import { CATEGORIAS, PRODUCTOS, soles, type Categoria, type Producto } from "@/lib/pizzas";

export type MenuSearch = { categoria?: Categoria | undefined };

function PizzaCard({ producto }: { producto: Producto }) {
  const { add } = useCart();
  const [tamano, setTamano] = useState<"Personal" | "Familiar">("Familiar");
  const [qty, setQty] = useState(1);
  const esBebida = producto.categoria === "Bebidas";
  const precio = tamano === "Personal" ? producto.precioPersonal : producto.precioFamiliar;

  return (
    <article className="card-soft overflow-hidden">
      <div className="relative">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          width={944}
          height={704}
          loading="lazy"
          className="h-40 w-full object-cover"
        />
        {!producto.disponible && (
          <span className="absolute inset-0 grid place-items-center bg-brand-black/60 text-sm font-bold uppercase tracking-wide text-white">
            Agotado
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold">{producto.nombre}</h3>
          <span className="shrink-0 rounded-full bg-secondary/25 px-2.5 py-0.5 text-xs font-bold text-brand-black">
            {soles(precio)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {producto.ingredientes}
        </p>

        {!esBebida && (
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["Personal", "Familiar"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTamano(t)}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  tamano === t
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border px-1 py-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
              aria-label="Menos"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
              aria-label="Más"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            disabled={!producto.disponible}
            onClick={() =>
              add(
                {
                  productoId: producto.id,
                  nombre: producto.nombre,
                  tamano,
                  precio,
                },
                qty,
              )
            }
            className="btn-tactile flex-1 bg-primary text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MenuPage() {
  const { categoria } = useSearch({ from: "/menu" });
  const navigate = useNavigate({ from: "/menu" });
  const filtrados = categoria
    ? PRODUCTOS.filter((p) => p.categoria === categoria)
    : PRODUCTOS;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">Nuestro Menú</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige tu favorita, tamaño y cantidad. Sin registro, paga al recibir.
        </p>

        {/* Filtros */}
        <div className="sticky top-16 z-30 -mx-4 mt-5 overflow-x-auto bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ search: {} })}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                !categoria
                  ? "bg-brand-black text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate({ search: { categoria: cat } })}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  categoria === cat
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <PizzaCard key={p.id} producto={p} />
          ))}
        </div>
      </main>
      <footer className="bg-brand-black px-4 py-6">
        <div className="mx-auto max-w-6xl">
          <WorkerAccessLink />
        </div>
      </footer>
      <FloatingCart />
    </div>
  );
}
