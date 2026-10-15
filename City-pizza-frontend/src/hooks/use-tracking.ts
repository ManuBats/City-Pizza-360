import { useEffect, useState } from "react";

// Lógica del tracking extraída de routes/tracking.tsx (mock temporal).
// TODO(Fase B): búsqueda por código + celular + polling 10s a
// PedidosService.tracking(codigo, celular) con useQuery(refetchInterval: 10_000).
export function useTrackingSimulado() {
  const [pasoActual, setPasoActual] = useState(2);
  useEffect(() => {
    const t = setInterval(() => {
      setPasoActual((p) => Math.min(p + 1, 5));
    }, 15000);
    return () => clearInterval(t);
  }, []);
  return { pasoActual, totalPasos: 6 };
}
