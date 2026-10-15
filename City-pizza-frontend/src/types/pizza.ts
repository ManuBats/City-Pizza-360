/** Espejo de Prisma: Pizza (módulo Catálogo). */
export type PizzaApi = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  /** Prisma Decimal llega como string en JSON; el service lo normaliza a number. */
  precio: number;
  precioPersonal: number;
  precioMediana: number;
  precioFamiliar: number;
  imagenUrl: string | null;
  destacada: boolean;
  disponible: boolean;
};

export type Categoria = "Clásicas" | "Especiales" | "Familiares" | "Bebidas";
