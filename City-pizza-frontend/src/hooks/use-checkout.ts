import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/context/cart-context";
import { COSTO_DELIVERY, resolverProducto } from "@/lib/pizzas";
import { usePizzas } from "@/hooks/use-pizzas";
import { PedidosService } from "@/services/pedidos.service";
import { guardarUltimoPedido } from "@/hooks/use-tracking";
import { getErrorMessage } from "@/services/api";
import type { Pedido } from "@/types/pedido";

export type CheckoutErrores = {
  items?: string;
  nombres?: string;
  apellidos?: string;
  celular?: string;
  direccion?: string;
};

export type PedidoConfirmado = {
  pedido: Pedido;
  requiereYape: boolean;
};

// Checkout contra POST /pedidos real. Resuelve slug→pizzaId y calcula todo
// en servidor; si es Yape, la page abre el modal QR + comprobante.
export function useCheckout() {
  const { items, subtotal, setQty, setNota, setExtraQueso, remove, clear } = useCart();
  const { productos } = usePizzas();
  const navigate = useNavigate();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [entrega, setEntrega] = useState<"delivery" | "recojo">("delivery");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Yape">("Efectivo");
  const [errores, setErrores] = useState<CheckoutErrores>({});
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState<PedidoConfirmado | null>(null);

  const esDelivery = entrega === "delivery";
  const total = subtotal + (esDelivery && subtotal > 0 ? COSTO_DELIVERY : 0);
  const celularValido = useMemo(() => /^9\d{8}$/.test(celular), [celular]);

  async function confirmar(): Promise<PedidoConfirmado | null> {
    const errs: CheckoutErrores = {};
    if (items.length === 0) errs.items = "Tu carrito está vacío.";
    if (nombres.trim().length < 2) errs.nombres = "Ingresa tus nombres.";
    if (apellidos.trim().length < 2) errs.apellidos = "Ingresa tus apellidos.";
    if (!celularValido) errs.celular = "Celular de 9 dígitos, empieza con 9.";
    if (esDelivery && direccion.trim().length < 5)
      errs.direccion = "Ingresa la dirección de entrega.";
    setErrores(errs);
    if (Object.keys(errs).length > 0) return null;

    // Resuelve cada línea contra el catálogo (slug histórico o id real).
    const lineas = [];
    for (const item of items) {
      const prod = resolverProducto(productos, item.productoId);
      if (!prod || !prod.disponible) {
        setErrores({ items: `“${item.nombre}” ya no está disponible. Quítala del carrito.` });
        return null;
      }
      lineas.push({
        pizzaId: prod.id,
        cantidad: item.qty,
        tamano: item.tamano,
        nota: item.nota?.trim() || undefined,
        extraQueso: item.extraQueso === true,
      });
    }

    setEnviando(true);
    try {
      const pedido = await PedidosService.crear({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        celular: celular.trim(),
        direccion: esDelivery ? direccion.trim() : "Recojo en tienda",
        referencia: referencia.trim() || undefined,
        tipoEntrega: esDelivery ? "Delivery" : "Recojo",
        metodoPago,
        items: lineas,
      });
      const resultado = { pedido, requiereYape: metodoPago === "Yape" };
      guardarUltimoPedido(pedido.codigo, pedido.celular);
      if (!resultado.requiereYape) {
        clear();
        await navigate({
          to: "/tracking",
          search: { codigo: pedido.codigo, celular: pedido.celular },
        });
        return null;
      }
      setConfirmado(resultado);
      return resultado;
    } catch (error) {
      setErrores({ items: getErrorMessage(error, "No se pudo confirmar el pedido.") });
      return null;
    } finally {
      setEnviando(false);
    }
  }

  /** Tras subir el comprobante Yape: limpia y va al tracking con código. */
  async function irATracking(pedido: Pedido) {
    clear();
    setConfirmado(null);
    await navigate({
      to: "/tracking",
      search: { codigo: pedido.codigo, celular: pedido.celular },
    });
  }

  return {
    items, subtotal, total, esDelivery, celularValido, errores, enviando,
    nombres, apellidos, celular, direccion, referencia, entrega, metodoPago,
    confirmado,
    setNombres, setApellidos, setCelular, setDireccion, setReferencia,
    setEntrega, setMetodoPago,
    setQty, setNota, setExtraQueso, remove, confirmar, irATracking,
  };
}
