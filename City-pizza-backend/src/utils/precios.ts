/** Reglas de precio CityPizza360 (puro, testeable). */
import { EXTRA_QUESO_PRECIO } from '../constants/negocio.constants';

export { EXTRA_QUESO_PRECIO };

export type Tamano = 'Personal' | 'Mediana' | 'Familiar';

/** Acepta number, string (JSON) o Decimal de Prisma. */
export type PrecioDb = number | string | { toString(): string };

export type PreciosPizza = {
  precioPersonal: PrecioDb;
  precioMediana: PrecioDb;
  precioFamiliar: PrecioDb;
};

export function precioPorTamano(pizza: PreciosPizza, tamano: Tamano): number {
  switch (tamano) {
    case 'Personal':
      return Number(pizza.precioPersonal);
    case 'Mediana':
      return Number(pizza.precioMediana);
    case 'Familiar':
      return Number(pizza.precioFamiliar);
  }
}

/** Precio unitario de una línea: tamaño + extra queso si aplica. */
export function precioLinea(
  pizza: PreciosPizza,
  tamano: Tamano,
  extraQueso: boolean,
): number {
  return precioPorTamano(pizza, tamano) + (extraQueso ? EXTRA_QUESO_PRECIO : 0);
}
