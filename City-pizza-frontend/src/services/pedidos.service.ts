import { apiFetch } from "./api";
import { getWorkerToken } from "@/lib/worker-token";
import type { CrearPedidoPayload, EstadoPedido, Pedido } from "@/types/pedido";

function toWriteBody(payload: CrearPedidoPayload) {
  return {
    nombres: payload.nombres.trim(),
    apellidos: payload.apellidos.trim(),
    celular: payload.celular.trim(),
    direccion: payload.direccion.trim(),
    referencia: payload.referencia?.trim() || undefined,
    tipoEntrega: payload.tipoEntrega,
    metodoPago: payload.metodoPago,
    mesa: payload.mesa,
    items: payload.items.map((i) => ({
      pizzaId: i.pizzaId,
      cantidad: i.cantidad,
      tamano: i.tamano,
      nota: i.nota?.trim() || undefined,
      extraQueso: i.extraQueso === true,
    })),
  };
}

function baseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url) throw new Error("VITE_API_URL no está definida en .env");
  return url.replace(/\/$/, "");
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

  /** Sube el comprobante Yape (multipart, sin header JSON). */
  async subirComprobante(pedidoId: number, archivo: File): Promise<Pedido> {
    const form = new FormData();
    form.append("comprobante", archivo);
    const token = getWorkerToken();
    const res = await fetch(`${baseUrl()}/pedidos/${pedidoId}/comprobante`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(
        typeof body.message === "string" ? body.message : "No se pudo subir el comprobante",
      );
    }
    return res.json() as Promise<Pedido>;
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
