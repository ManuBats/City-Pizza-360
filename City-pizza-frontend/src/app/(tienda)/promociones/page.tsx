import { LoaderCircle, Tag } from "lucide-react";
import { TiendaLayout } from "@/app/layouts/TiendaLayout";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PromocionCard } from "@/components/promociones/PromocionCard";
import { usePromociones } from "@/hooks/use-promociones";
import { getErrorMessage } from "@/services/api";

export function PromocionesPage() {
  const { promociones, isPending, isError, error, refetch } = usePromociones();

  return (
    <TiendaLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">Promociones</h1>
        <p className="mt-2 text-muted-foreground">Descubre las ofertas disponibles de CityPizza360.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulta las condiciones en tienda. Estas ofertas aún no se pueden agregar al carrito ni se aplican automáticamente a los pedidos web.
        </p>
        <div className="mt-6">
          {isPending ? (
            <p role="status" className="flex items-center gap-2 py-10 text-muted-foreground">
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />
              Cargando promociones…
            </p>
          ) : isError ? (
            <div role="alert">
              <ErrorBanner
                mensaje={getErrorMessage(error, "No se pudieron cargar las promociones.")}
                onReintentar={() => { void refetch(); }}
              />
            </div>
          ) : promociones.length === 0 ? (
            <div role="status" className="card-soft px-5 py-12 text-center">
              <Tag aria-hidden="true" className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold">No hay promociones disponibles por ahora</h2>
              <p className="mt-2 text-sm text-muted-foreground">Vuelve pronto para descubrir nuevas ofertas.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {promociones.map((promocion) => <PromocionCard key={promocion.id} promocion={promocion} />)}
            </div>
          )}
        </div>
      </main>
    </TiendaLayout>
  );
}
