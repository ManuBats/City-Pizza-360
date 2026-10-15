import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";
import type { Comanda, LineaComanda } from "@/types/mesa";

// Comanda real: POST /pedidos { tipoEntrega: Mesa } + nota por línea.
// La nota de la comanda se replica en cada línea para que el KDS la vea.
const COMANDAS_KEY = "citypizza360-comandas";

function leerEnviadas(): Comanda[] {
  try {
    const raw = window.localStorage.getItem(COMANDAS_KEY);
    return raw ? (JSON.parse(raw) as Comanda[]) : [];
  } catch {
    return [];
  }
}

export function useComanda() {
  const [mesa, setMesa] = useState<number | null>(null);
  const [lineas, setLineas] = useState<LineaComanda[]>([]);
  const [nota, setNota] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Yape">("Efectivo");
  const [enviadas, setEnviadas] = useState<Comanda[]>(leerEnviadas);
  const [tamanoPorId, setTamanoPorId] = useState<Record<number, "Personal" | "Familiar">>({});
  const [enviando, setEnviando] = useState(false);

  const total = useMemo(() => lineas.reduce((acc, l) => acc + l.precio * l.qty, 0), [lineas]);
  const celularValido = useMemo(() => /^9\d{8}$/.test(celular), [celular]);

  function agregar(productoId: number, nombreProd: string, precioPersonal: number, precioFamiliar: number, esBebida: boolean) {
    const tamano = esBebida ? "Personal" : (tamanoPorId[productoId] ?? "Familiar");
    const precio = tamano === "Personal" ? precioPersonal : precioFamiliar;
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.productoId === productoId && l.tamano === tamano);
      if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productoId, nombre: nombreProd, tamano, precio, qty: 1 }];
    });
  }

  function cambiarQty(index: number, delta: number) {
    setLineas((prev) =>
      prev
        .map((l, i) => (i === index ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function setTamano(productoId: number, tamano: "Personal" | "Familiar") {
    setTamanoPorId((prev) => ({ ...prev, [productoId]: tamano }));
  }

  async function enviarACocina() {
    if (mesa === null || lineas.length === 0) return;
    if (nombre.trim().length < 2) {
      toast.error("Ingresa el nombre del cliente.");
      return;
    }
    if (!celularValido) {
      toast.error("Celular de 9 dígitos, empieza con 9.");
      return;
    }
    setEnviando(true);
    try {
      const notaLinea = nota.trim() || undefined;
      const pedido = await PedidosService.crear({
        nombres: nombre.trim(),
        apellidos: `Mesa ${mesa}`,
        celular: celular.trim(),
        direccion: `Mesa ${mesa}`,
        tipoEntrega: "Mesa",
        metodoPago,
        mesa,
        items: lineas.map((l) => ({
          pizzaId: l.productoId,
          cantidad: l.qty,
          tamano: l.tamano,
          nota: notaLinea,
        })),
      });
      const comanda: Comanda = {
        id: pedido.codigo,
        mesa,
        items: lineas,
        nota: nota.trim(),
        total: Number(pedido.total),
        hora: new Date(pedido.creadoEn).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setEnviadas((prev) => {
        const next = [comanda, ...prev].slice(0, 20);
        try {
          window.localStorage.setItem(COMANDAS_KEY, JSON.stringify(next));
        } catch {
          /* almacenamiento no disponible */
        }
        return next;
      });
      setLineas([]);
      setNota("");
      setNombre("");
      setCelular("");
      setMesa(null);
      toast.success(`Comanda ${pedido.codigo} enviada a cocina`);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo enviar la comanda."));
    } finally {
      setEnviando(false);
    }
  }

  function limpiar() {
    setLineas([]);
    setNota("");
    setMesa(null);
  }

  return {
    mesa, setMesa,
    lineas, nota, setNota, enviadas,
    nombre, setNombre, celular, setCelular, celularValido,
    metodoPago, setMetodoPago, enviando,
    tamanoPorId, setTamano,
    total,
    agregar, cambiarQty, enviarACocina, limpiar,
  };
}
