import { useState } from "react";
import { Banknote, CheckCircle2, Loader2, QrCode, Upload } from "lucide-react";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";
import { urlPublica } from "@/lib/imagenes";
import { soles } from "@/lib/pizzas";
import type { Pedido } from "@/types/pedido";

interface YapeModalProps {
  pedido: Pedido;
  onSubido: (pedido: Pedido) => void;
  onOmitir: () => void;
}

const YAPE_TITULAR = "City Pizza Center";
const YAPE_QR_URL = ""; // TODO: el dueño pasa el QR real (imagen en public/yape-qr.png)

/** Modal de pago Yape: muestra QR + titular y sube el comprobante. */
export function YapeModal({ pedido, onSubido, onOmitir }: YapeModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recibido, setRecibido] = useState<Pedido | null>(null);

  async function subir() {
    if (!archivo) {
      setError("Selecciona la captura de tu Yapeo.");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const actualizado = await PedidosService.subirComprobante(pedido.id, archivo);
      setRecibido(actualizado);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo subir el comprobante."));
    } finally {
      setSubiendo(false);
    }
  }

  if (recibido) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/70 p-4">
        <div className="card-soft w-full max-w-sm p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-3 text-2xl font-extrabold">¡Comprobante recibido!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido {recibido.codigo} en cocina. Te avisaremos cuando esté en camino.
          </p>
          <button
            onClick={() => onSubido(recibido)}
            className="btn-tactile mt-5 w-full bg-primary text-white transition-colors hover:bg-primary/90"
          >
            Ver mi pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/70 p-4">
      <div className="card-soft w-full max-w-sm p-6 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Pedido {pedido.codigo}</p>
        <h2 className="mt-1 text-2xl font-extrabold">
          Paga {soles(Number(pedido.total))} por Yape
        </h2>

        <div className="mx-auto mt-4 grid h-52 w-52 place-items-center overflow-hidden rounded-2xl border border-border bg-muted">
          {urlPublica(YAPE_QR_URL) ? (
            <img src={urlPublica(YAPE_QR_URL)!} alt="QR Yape de City Pizza" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
              <QrCode className="h-12 w-12" />
              <p className="text-xs">QR pendiente (el local lo configura pronto)</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm">
          Titular: <strong>{YAPE_TITULAR}</strong>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Escanea, yapea el total exacto y sube tu captura para validar el pedido.
        </p>

        <label className="btn-tactile mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-background text-sm font-semibold">
          <Upload className="h-4 w-4" />
          {archivo ? archivo.name : "Subir captura del Yapeo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
        {error && <p className="mt-2 text-xs font-semibold text-primary">{error}</p>}

        <button
          onClick={subir}
          disabled={subiendo}
          className="btn-tactile mt-3 w-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {subiendo ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
            </span>
          ) : (
            "Confirmar pago"
          )}
        </button>
        <button
          onClick={onOmitir}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Banknote className="h-3.5 w-3.5" /> Seguir sin comprobante (pagaré en tienda)
        </button>
      </div>
    </div>
  );
}
