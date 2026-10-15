import { apiFetch } from "./api";
import type { CrearPedidoPayload, EstadoPedido, Pedido } from "@/types/pedido";

function toWriteBody(payload: CrearPedidoPayload) {
  return {
    nombres: payload.nombres.trim(),
    apellidos: payload.apellidos.trim(),
    celular: payload.celular.trim(),
    direccion: payload.direccion.trim(),
    referencia: payload.referencia?.trim() || undefined,
    items: payload.items,
  };
}

/** Módulo Pedidos: checkout invitado + tracking + cambio de estado. */
export const PedidosService = {
  /** POST /pedidos (sin token). */
  async crear(payload: CrearPedidoPayload): Promise<Pedido> {
    return apiFetch<Pedido>("/pedidos", {
      method: "POST",
      body: JSON.stringify(toWriteBody(payload)),
    });
  },

  /** Tracking invitado por código + celular. */
  async tracking(codigo: string, celular: string): Promise<Pedido> {
    const params = new URLSearchParams({ codigo, celular });
    return apiFetch<Pedido>(`/pedidos/tracking?${params.toString()}`);
  },

  async list(): Promise<Pedido[]> {
    return apiFetch<Pedido[]>("/pedidos");
  },

  async cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
    return apiFetch<Pedido>(`/pedidos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  },
};
