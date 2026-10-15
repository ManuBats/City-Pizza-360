import { useNavigate, useSearch } from "@tanstack/react-router";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { PizzaCard } from "@/components/menu/PizzaCard";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { usePizzas } from "@/hooks/use-pizzas";
import { CATEGORIAS } from "@/lib/pizzas";

export function MenuPage() {
  const { productos: PRODUCTOS } = usePizzas();
  const { categoria } = useSearch({ from: "/menu" });
  const navigate = useNavigate({ from: "/menu" });
  const filtrados = categoria
    ? PRODUCTOS.filter((p) => p.categoria === categoria)
    : PRODUCTOS;

  return (
    <TiendaLayout>
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
      <FloatingCart />
    </TiendaLayout>
  );
}
