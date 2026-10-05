import { Link } from "@tanstack/react-router";
import { Pizza, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary">
            <Pizza className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            CityPizza<span className="text-secondary">360</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/menu"
            search={{ categoria: undefined }}
            className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white [&.active]:bg-white/10 [&.active]:text-white"
          >
            Menú
          </Link>
          <Link
            to="/tracking"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:block [&.active]:bg-white/10 [&.active]:text-white"
          >
            Mi pedido
          </Link>
          <Link
            to="/checkout"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-primary transition-colors hover:bg-primary/90"
            aria-label="Carrito"
          >
            <ShoppingCart className="h-5 w-5 text-white" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-xs font-bold text-brand-black">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
