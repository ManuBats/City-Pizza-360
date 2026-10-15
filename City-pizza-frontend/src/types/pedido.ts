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
  tamano: string;
  nota: string | null;
  extraQueso: boolean;
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
  tipoEntrega: string;
  metodoPago: "Efectivo" | "Yape";
  estadoPago: "Pendiente" | "Verificado" | "Rechazado";
  comprobanteUrl: string | null;
  repartidorId: number | null;
  repartidor: { nombre: string; usuario: string } | null;
  mesa: number | null;
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
  tipoEntrega?: "Delivery" | "Recojo" | "Mesa";
  metodoPago?: "Efectivo" | "Yape";
  mesa?: number;
  items: {
    pizzaId: number;
    cantidad: number;
    tamano: "Personal" | "Mediana" | "Familiar";
    nota?: string;
    extraQueso?: boolean;
  }[];
};
