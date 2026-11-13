import type { Producto } from "@/lib/pizzas";
import type { PromocionApi } from "@/services/promociones.service";

export type TamanoPromocion = NonNullable<PromocionApi["tamano"]>;

export function ProductoPromocion({ productos, pizzaId, tamano, onProducto, onTamano }: {
  productos: Producto[];
  pizzaId: number | null;
  tamano: TamanoPromocion;
  onProducto: (id: number | null) => void;
  onTamano: (tamano: TamanoPromocion) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        Producto en promoción
        <select className="rounded-xl border border-input bg-background p-2" value={pizzaId ?? ""} onChange={(e) => onProducto(Number(e.target.value) || null)}>
          <option value="">Solo mostrar en la vitrina</option>
          {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Tamaño en promoción
        <select className="rounded-xl border border-input bg-background p-2" disabled={!pizzaId} value={tamano} onChange={(e) => onTamano(e.target.value as TamanoPromocion)}>
          <option>Personal</option>
          <option>Mediana</option>
          <option>Familiar</option>
        </select>
      </label>
    </div>
  );
}
