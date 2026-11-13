import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PromocionesService } from "@/services/promociones.service";
import { promocionVigente } from "@/lib/promociones";

export function usePromociones() {
  const [ahora, setAhora] = useState(() => Date.now());
  const consulta = useQuery({
    queryKey: ["promociones-visibles"],
    queryFn: () => PromocionesService.visibles(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 30_000,
    retry: 1,
  });

  useEffect(() => {
    const actualizar = () => setAhora(Date.now());
    // Se programa el próximo inicio/fin, sin depender del éxito de la red.
    const instante = Date.now();
    const limites = (consulta.data ?? []).flatMap((promo) => [
      Date.parse(promo.inicio),
      promo.fin === null ? NaN : Date.parse(promo.fin),
    ]).filter((fecha) => fecha > instante);
    const espera = Math.min(60_000, ...limites.map((fecha) => fecha - instante));
    const timer = window.setTimeout(actualizar, espera);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [consulta.data, ahora]);

  return {
    ...consulta,
    promociones: (consulta.data ?? []).filter((promo) =>
      promocionVigente(promo, Math.max(ahora, Date.now())),
    ),
  };
}
