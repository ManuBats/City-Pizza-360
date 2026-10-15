/** Espejo de Prisma: Pedido + Detalle (módulo Pedidos). */
export type EstadoPedido =
  | "Recibido"
  | "Preparacion"
  | "Listo"
  | "EnCamino"
  | "Entregado";

export type PedidoDetalle = {
  id: number;
  pedidoId: number;
  pizzaId: number;
  cantidad: number;
  precioUnit: number;
  pizza: { id: number; nombre: string };
};

export type Pedido = {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  celular: string;
  direccion: string;
  referencia: string | null;
  estado: EstadoPedido;
  total: number;
  creadoEn: string;
  detalles: PedidoDetalle[];
};

export type CrearPedidoPayload = {
  nombres: string;
  apellidos: string;
  celular: string;
  direccion: string;
  referencia?: string;
  items: { pizzaId: number; cantidad: number; tamano: "Personal" | "Familiar" }[];
};
