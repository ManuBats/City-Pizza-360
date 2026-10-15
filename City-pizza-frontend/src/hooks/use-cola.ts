import { useEffect, useState } from "react";

export type TicketKds = {
  id: string;
  cliente: string;
  entrega: "Delivery" | "Recojo";
  recibidoEn: number;
  estado: "nuevo" | "preparando";
  items: { qty: number; nombre: string; nota?: string }[];
};

const AHORA = Date.now();

const TICKETS_INICIALES: TicketKds[] = [
  {
    id: "#0125",
    cliente: "María Torres",
    entrega: "Delivery",
    recibidoEn: AHORA - 21 * 60_000,
    estado: "preparando",
    items: [
      { qty: 1, nombre: "Americana Familiar" },
      { qty: 1, nombre: "Cuatro Quesos Personal", nota: "Sin aceitunas" },
    ],
  },
  {
    id: "#0126",
    cliente: "Carlos Mendoza",
    entrega: "Recojo",
    recibidoEn: AHORA - 9 * 60_000,
    estado: "preparando",
    items: [{ qty: 2, nombre: "Pepperoni Personal", nota: "Extra queso en una" }],
  },
  {
    id: "#0127",
    cliente: "Rosa Quispe",
    entrega: "Delivery",
    recibidoEn: AHORA - 2 * 60_000,
    estado: "nuevo",
    items: [
      { qty: 1, nombre: "Hawaiana Familiar" },
      { qty: 1, nombre: "Gaseosa 1L", nota: "Inca Kola" },
    ],
  },
];

// Lógica KDS extraída de routes/cocina.tsx (mock temporal).
// TODO(Fase B): useQuery(CocinaService.cola, { refetchInterval: 3_000 }) +
// PedidosService.cambiarEstado para Iniciar/¡Listo! + asignar repartidor.
export function useCola() {
  const [tickets, setTickets] = useState(TICKETS_INICIALES);
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(Date.now());
      setTickets((prev) => {
        const siguiente = 128 + Math.floor((Date.now() - AHORA) / 30_000);
        const existe = prev.some((t) => t.id === `#0${siguiente}`);
        if (existe || prev.length >= 6) return prev;
        return [
          ...prev,
          {
            id: `#0${siguiente}`,
            cliente: "Cliente mostrador",
            entrega: "Recojo" as const,
            recibidoEn: Date.now(),
            estado: "nuevo" as const,
            items: [{ qty: 1, nombre: "Suprema Familiar" }],
          },
        ];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function iniciar(id: string) {
    setTickets((prev) =>
      prev.map((x) => (x.id === id ? { ...x, estado: "preparando" as const } : x)),
    );
  }

  function marcarListo(id: string) {
    setTickets((prev) => prev.filter((x) => x.id !== id));
  }

  return {
    tickets,
    ahora,
    nuevos: tickets.filter((t) => t.estado === "nuevo"),
    preparando: tickets.filter((t) => t.estado === "preparando"),
    iniciar,
    marcarListo,
  };
}

export function minutosDesde(ts: number, ahora: number) {
  return Math.max(0, Math.floor((ahora - ts) / 60_000));
}
