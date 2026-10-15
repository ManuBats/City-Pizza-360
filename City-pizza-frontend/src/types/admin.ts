/** Tipos de vista del panel admin/cajero (mock local hasta el rewiring).
 *  NOTA: los estados de vista ("En cocina") difieren de los del backend
 *  (Recibido→Preparacion→Listo→EnCamino→Entregado); se mapean al conectar.
 *  TODO(Fase 3): reemplazar por types/pedido.ts + datos de la API.
 */
export type EstadoPedidoVista =
  | "Recibido"
  | "En cocina"
  | "Listo"
  | "En camino"
  | "Entregado";

export type PedidoVista = {
  id: string;
  cliente: string;
  celular?: string;
  items: string;
  total: number;
  estado: EstadoPedidoVista;
  entrega: "Delivery" | "Recojo";
  hora: string;
};

export const SIGUIENTE_ESTADO_VISTA: Partial<Record<EstadoPedidoVista, EstadoPedidoVista>> = {
  Recibido: "En cocina",
  "En cocina": "Listo",
  Listo: "En camino",
  "En camino": "Entregado",
};

export type InsumoVista = {
  nombre: string;
  stock: number;
  minimo: number;
  unidad: string;
};

export type PromoVista = {
  id: string;
  titulo: string;
  detalle: string;
  activa: boolean;
};

export type TabAdmin = "pedidos" | "catalogo" | "inventario";
