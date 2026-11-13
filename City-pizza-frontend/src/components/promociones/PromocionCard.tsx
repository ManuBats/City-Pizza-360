import { Clock, Tag } from "lucide-react";
import type { PromocionApi } from "@/services/promociones.service";
import { fechaPromocion } from "@/lib/promociones";
import { soles, type Producto } from "@/lib/pizzas";
import { urlPublica } from "@/lib/imagenes";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";

export function PromocionCard({ promocion, producto }: { promocion: PromocionApi; producto?: Producto }) {
  const { add } = useCart();
  const { tamano } = promocion;
  const precioBase = tamano === "Personal" ? producto?.precioPersonal
    : tamano === "Mediana" ? producto?.precioMediana : producto?.precioFamiliar;
  const precio = promocion.pedidoOnline ? promocion.precioPromo : Math.min(promocion.precioPromo, precioBase ?? promocion.precioPromo);
  return (
    <article className="card-soft flex h-full min-w-0 flex-col overflow-hidden">
      {promocion.imagenUrl && <img src={urlPublica(promocion.imagenUrl) ?? undefined} alt="" className="aspect-video w-full object-cover" />}
      <div className="flex items-center justify-between gap-3 bg-brand-black p-5 text-white">
        <Tag aria-hidden="true" className="h-6 w-6 shrink-0 text-secondary" />
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-brand-black">
          {promocion.tipo === "Flash" ? "Flash" : "Permanente"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="break-words text-xl font-bold">{promocion.nombre}</h2>
        <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
          {promocion.descripcion || "Consulta las condiciones de esta promoción en tienda."}
        </p>
        <p className="text-3xl font-extrabold text-primary">{soles(precio)}</p>
        {promocion.pizzaId && promocion.tamano && (
          <p className="text-sm text-muted-foreground">Tamaño {promocion.tamano.toLowerCase()}. Se aplica en el carrito.</p>
        )}
        <p className="mt-auto flex items-start gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
          <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {promocion.fin ? (
            <span>Vence <time dateTime={promocion.fin}>{fechaPromocion(promocion.fin)}</time> (hora de Lima)</span>
          ) : "Sin fecha de vencimiento"}
        </p>
        {promocion.pedidoOnline ? (
          <button type="button" className="btn-tactile bg-primary px-4 text-white" onClick={() => {
            add({ promocionId: promocion.id, nombre: promocion.nombre, precio });
            toast.success("Agregado al carrito");
          }}>Agregar al carrito</button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {promocion.pizzaId && tamano ? "Pide el producto desde el menú." : "Consulta esta oferta en el local."}
          </p>
        )}
      </div>
    </article>
  );
}
