import { apiFetch } from "./api";
import { getWorkerToken } from "@/lib/worker-token";
import type { CrearPedidoPayload, EstadoPedido, Pedido } from "@/types/pedido";

function toWriteBody(payload: CrearPedidoPayload) {
  return {
    totalEsperado: payload.totalEsperado,
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
      promocionId: i.promocionId,
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
  async crear(payload: CrearPedidoPayload, intento: { actual?: { body: string; clave: string; archivo?: File } }, archivo?: File): Promise<Pedido> {
    const path = archivo ? "/pedidos/yape" : payload.tipoEntrega === "Mesa" ? "/pedidos/mesa" : "/pedidos";
    const body = toWriteBody(payload);
    const { totalEsperado, ...contenido } = body;
    const key = JSON.stringify(contenido);
    if (intento.actual?.body !== key || intento.actual.archivo !== archivo)
      intento.actual = { body: key, clave: crypto.randomUUID(), archivo };
    const datos = JSON.stringify({ ...contenido, totalEsperado, claveSolicitud: intento.actual.clave });
    if (archivo) {
      const form = new FormData();
      form.append("pedido", datos);
      form.append("comprobante", archivo);
      return apiFetch<Pedido>(path, { method: "POST", body: form });
    }
    return apiFetch<Pedido>(path, {
      method: "POST",
      body: datos,
    });
  },

  /** Sube el comprobante Yape (multipart, sin header JSON). */
  async subirComprobante(pedido: Pedido, archivo: File): Promise<Pedido> {
    const form = new FormData();
    form.append("comprobante", archivo);
    const token = pedido.comprobanteToken ??
      (await this.tracking(pedido.codigo, pedido.celular)).comprobanteToken;
    if (!token) throw new Error("Este pedido no admite comprobantes.");
    const res = await fetch(`${baseUrl()}/pedidos/${pedido.id}/comprobante`, {
      method: "POST",
      headers: { "X-Comprobante-Token": token },
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

  async leerComprobante(id: number): Promise<Blob> {
    const res = await fetch(`${baseUrl()}/pedidos/${id}/comprobante`, {
      headers: { Authorization: `Bearer ${getWorkerToken() ?? ""}` },
    });
    if (!res.ok) throw new Error("No se pudo abrir el comprobante.");
    return res.blob();
  },

  verificarPago(id: number, estadoPago: "Verificado" | "Rechazado") {
    return apiFetch<Pedido>(`/pedidos/${id}/pago`, {
      method: "PATCH",
      body: JSON.stringify({ estadoPago }),
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

  async asignarRepartidor(id: number, repartidorId: number): Promise<Pedido> {
    return apiFetch<Pedido>(`/pedidos/${id}/asignar`, {
      method: "PATCH",
      body: JSON.stringify({ repartidorId }),
    });
  },

  async misEntregas(): Promise<Pedido[]> {
    return apiFetch<Pedido[]>("/pedidos/mis-entregas");
  },
};
