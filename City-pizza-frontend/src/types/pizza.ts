/** Espejo de Prisma: Pizza (módulo Catálogo). */
export type PizzaApi = {
  id: number;
  nombre: string;
  /** Prisma Decimal llega como string en JSON; el service lo normaliza a number. */
  precio: number;
  disponible: boolean;
};

export type Categoria = "Clásicas" | "Especiales" | "Familiares" | "Bebidas";
