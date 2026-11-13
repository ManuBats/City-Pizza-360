import { useState } from "react";
import type { ReferenciaPedido } from "@/hooks/use-tracking";

export function AccionesSeguimiento({ pedido }: { pedido: ReferenciaPedido }) {
  const [mensaje, setMensaje] = useState("");
  const estilo = "rounded-xl border border-border px-3 py-2 text-sm font-semibold";

  async function copiar(tipo: "codigo" | "enlace") {
    const url = new URL("/tracking", window.location.origin);
    url.search = new URLSearchParams({ codigo: pedido.codigo, celular: pedido.celular }).toString();
    try {
      await navigator.clipboard.writeText(tipo === "codigo" ? pedido.codigo : url.href);
      setMensaje(tipo === "codigo" ? "Código copiado." : "Enlace copiado.");
    } catch {
      setMensaje("No pudimos copiar. Puedes guardar el código o abrir el seguimiento y copiar la dirección.");
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className={estilo} onClick={() => void copiar("codigo")}>
          Copiar código
        </button>
        <button type="button" className={estilo} onClick={() => void copiar("enlace")}>
          Copiar enlace de seguimiento
        </button>
      </div>
      {mensaje && <p role="status" className="mt-2 text-sm text-muted-foreground">{mensaje}</p>}
    </div>
  );
}
