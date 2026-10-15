import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/context/cart-context";
import { COSTO_DELIVERY } from "@/lib/pizzas";
import { getErrorMessage } from "@/services/api";

export type CheckoutErrores = {
  items?: string;
  nombres?: string;
  apellidos?: string;
  celular?: string;
  direccion?: string;
};

// Lógica del checkout extraída de routes/checkout.tsx.
// TODO(Fase B): confirmar() debe llamar PedidosService.crear() y navegar
// a /tracking con el código real ( Flujo Yape: modal QR + comprobante ).
export function useCheckout() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const navigate = useNavigate();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [entrega, setEntrega] = useState<"delivery" | "recojo">("delivery");
  const [errores, setErrores] = useState<CheckoutErrores>({});
  const [enviando, setEnviando] = useState(false);

  const esDelivery = entrega === "delivery";
  const total = subtotal + (esDelivery && subtotal > 0 ? COSTO_DELIVERY : 0);
  const celularValido = useMemo(() => /^9\d{8}$/.test(celular), [celular]);

  async function confirmar() {
    const errs: CheckoutErrores = {};
    if (items.length === 0) errs.items = "Tu carrito está vacío.";
    if (nombres.trim().length < 2) errs.nombres = "Ingresa tus nombres.";
    if (apellidos.trim().length < 2) errs.apellidos = "Ingresa tus apellidos.";
    if (!celularValido) errs.celular = "Celular de 9 dígitos, empieza con 9.";
    if (esDelivery && direccion.trim().length < 5)
      errs.direccion = "Ingresa la dirección de entrega.";
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;

    setEnviando(true);
    try {
      // Mock temporal: limpia y navega. Fase B: POST /pedidos real.
      clear();
      await navigate({ to: "/tracking" });
    } catch (error) {
      setErrores({ items: getErrorMessage(error, "No se pudo confirmar el pedido.") });
    } finally {
      setEnviando(false);
    }
  }

  return {
    items, subtotal, total, esDelivery, celularValido, errores, enviando,
    nombres, apellidos, celular, direccion, referencia, entrega,
    setNombres, setApellidos, setCelular, setDireccion, setReferencia, setEntrega,
    setQty, remove, confirmar,
  };
}
