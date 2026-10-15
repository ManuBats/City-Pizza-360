import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Pizza, Truck, UtensilsCrossed } from "lucide-react";
import { FloatingCart } from "@/components/cart/FloatingCart";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { useCart } from "@/context/cart-context";
import { usePizzas } from "@/hooks/use-pizzas";
import { CATEGORIAS, LOCAL, soles } from "@/lib/pizzas";

const CATEGORIA_ICON: Record<string, typeof Pizza> = {
  Clásicas: Pizza,
  Especiales: UtensilsCrossed,
  Familiares: Pizza,
  Bebidas: Truck,
};

export function LandingPage() {
  const { add } = useCart();
  const { productos: PRODUCTOS } = usePizzas();
  const top = PRODUCTOS.filter((p) => p.top);

  return (
    <TiendaLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-black text-white">
        <img
          src="/images/hero-pizza.png"
          alt="Pizza pepperoni recién horneada"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:py-28">
          <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-brand-black">
            {LOCAL.nombre} · Cañete
          </span>
          <h1 className="max-w-2xl text-balance text-4xl font-extrabold leading-tight sm:text-6xl">
            La mejor pizza de Cañete, <span className="text-secondary">a un clic</span>
          </h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg">
            Masa fresca, ingredientes generosos y horno caliente. Pide delivery o recoge en tienda.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              search={{ categoria: undefined }}
              className="btn-tactile inline-flex items-center gap-2 bg-primary px-7 text-white transition-colors hover:bg-primary/90"
            >
              Ver Menú <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#top-pizzas"
              className="btn-tactile inline-flex items-center gap-2 border border-white/30 px-7 text-white transition-colors hover:bg-white/10"
            >
              Las favoritas
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-secondary" /> {LOCAL.direccion}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-secondary" /> {LOCAL.horario}
            </span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Explora por categoría</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIAS.map((cat) => {
            const Icon = CATEGORIA_ICON[cat] ?? Pizza;
            return (
              <Link
                key={cat}
                to="/menu"
                search={{ categoria: cat }}
                className="card-soft group flex flex-col items-center gap-3 p-6 text-center transition-transform hover:-translate-y-1"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary/25 text-primary transition-colors group-hover:bg-secondary">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="font-semibold">{cat}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top 3 */}
      <section id="top-pizzas" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Las más pedidas</h2>
          <Link to="/menu" search={{ categoria: undefined }} className="text-sm font-semibold text-primary hover:underline">
            Ver todo el menú →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {top.map((p) => (
            <article key={p.id} className="card-soft overflow-hidden">
              <img
                src={p.imagen}
                alt={`Pizza ${p.nombre}`}
                width={944}
                height={704}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
              <div className="p-5">
                <h3 className="text-lg font-bold">{p.nombre}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.ingredientes}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>
                    Familiar <strong className="text-primary">{soles(p.precioFamiliar)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Personal {soles(p.precioPersonal)}
                  </span>
                </div>
                <button
                  onClick={() =>
                    add({
                      productoId: p.id,
                      nombre: p.nombre,
                      tamano: "Familiar",
                      precio: p.precioFamiliar,
                    })
                  }
                  className="btn-tactile mt-4 w-full bg-primary text-white transition-colors hover:bg-primary/90"
                >
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FloatingCart />
    </TiendaLayout>
  );
}
