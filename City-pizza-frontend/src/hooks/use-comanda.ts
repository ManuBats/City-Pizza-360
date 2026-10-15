import { useMemo, useState } from "react";
import type { Comanda, LineaComanda } from "@/types/mesa";

// Lógica de la comanda extraída de app/(interno)/mesa/page.tsx (mock).
// TODO(Fase 3): enviarACocina() -> POST /pedidos { mesa, items con nota }.
export function useComanda() {
  const [mesa, setMesa] = useState<number | null>(null);
  const [lineas, setLineas] = useState<LineaComanda[]>([]);
  const [nota, setNota] = useState("");
  const [enviadas, setEnviadas] = useState<Comanda[]>([]);
  const [tamanoPorId, setTamanoPorId] = useState<Record<number, "Personal" | "Familiar">>({});

  const total = useMemo(() => lineas.reduce((acc, l) => acc + l.precio * l.qty, 0), [lineas]);

  function agregar(productoId: number, nombre: string, precioPersonal: number, precioFamiliar: number, esBebida: boolean) {
    const tamano = esBebida ? "Personal" : (tamanoPorId[productoId] ?? "Familiar");
    const precio = tamano === "Personal" ? precioPersonal : precioFamiliar;
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.productoId === productoId && l.tamano === tamano);
      if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productoId, nombre, tamano, precio, qty: 1 }];
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

  function enviarACocina() {
    if (mesa === null || lineas.length === 0) return;
    const comanda: Comanda = {
      id: `#M${String(enviadas.length + 1).padStart(3, "0")}`,
      mesa,
      items: lineas,
      nota: nota.trim(),
      total,
      hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
    };
    setEnviadas((prev) => [comanda, ...prev]);
    setLineas([]);
    setNota("");
    setMesa(null);
  }

  function limpiar() {
    setLineas([]);
    setNota("");
    setMesa(null);
  }

  return {
    mesa, setMesa,
    lineas, nota, setNota, enviadas,
    tamanoPorId, setTamano,
    total,
    agregar, cambiarQty, enviarACocina, limpiar,
  };
}
