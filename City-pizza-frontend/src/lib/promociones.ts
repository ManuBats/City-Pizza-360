import type { PromocionApi } from "@/services/promociones.service";

/** La igualdad con fin ya significa vencimiento. Fechas inválidas no se publican. */
export function promocionVigente(promo: PromocionApi, ahora: number): boolean {
  return (
    promo.activa &&
    Date.parse(promo.inicio) <= ahora &&
    (promo.fin === null || Date.parse(promo.fin) > ahora)
  );
}

export function fechaPromocion(fecha: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}
