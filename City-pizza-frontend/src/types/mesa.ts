/** Tipos de la comanda del mesero (mock local hasta el rewiring).
 *  TODO(Fase 3): POST /pedidos con { mesa } + nota por línea.
 */
export type LineaComanda = {
  productoId: string;
  nombre: string;
  tamano: "Personal" | "Familiar";
  precio: number;
  qty: number;
};

export type Comanda = {
  id: string;
  mesa: number;
  items: LineaComanda[];
  nota: string;
  total: number;
  hora: string;
};

/** Mesas físicas del salón (config del local, no va a BD). */
export const MESAS = Array.from({ length: 12 }, (_, i) => i + 1);
