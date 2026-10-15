import { useState } from "react";

export type Entrega = {
  id: string;
  cliente: string;
  celular: string;
  direccion: string;
  referencia?: string;
  resumen: string;
  estado: "pendiente" | "en-camino" | "entregado";
};

const ENTREGAS_INICIALES: Entrega[] = [
  {
    id: "#0125",
    cliente: "María Torres",
    celular: "999111222",
    direccion: "Jr. Grau 123, San Vicente de Cañete",
    referencia: "Frente al parque, puerta negra",
    resumen: "Americana Familiar + Cuatro Quesos Personal",
    estado: "en-camino",
  },
  {
    id: "#0127",
    cliente: "Rosa Quispe",
    celular: "987654321",
    direccion: "Av. Sepúlveda 450, San Vicente de Cañete",
    referencia: "Casa amarilla, segundo piso",
    resumen: "Hawaiana Familiar + Gaseosa 1L",
    estado: "pendiente",
  },
  {
    id: "#0124",
    cliente: "Jorge Huamán",
    celular: "955444333",
    direccion: "Calle Los Pinos 88, San Vicente de Cañete",
    resumen: "Familiar Carnes",
    estado: "entregado",
  },
];

export function mapsUrl(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion + ", Perú")}`;
}

// Lógica de entregas extraída de routes/delivery.tsx (mock temporal).
// TODO(módulo Delivery): PedidosService.misEntregas() + cambiarEstado().
export function useEntregas() {
  const [entregas, setEntregas] = useState(ENTREGAS_INICIALES);

  function avanzar(id: string) {
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, estado: e.estado === "pendiente" ? "en-camino" : "entregado" }
          : e,
      ),
    );
  }

  return {
    activas: entregas.filter((e) => e.estado !== "entregado"),
    hechas: entregas.filter((e) => e.estado === "entregado"),
    avanzar,
  };
}
