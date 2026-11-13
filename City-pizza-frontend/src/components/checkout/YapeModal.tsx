import { useState } from "react";
import { Banknote, Check, CheckCircle2, Copy, Loader2, Upload } from "lucide-react";
import { PedidosService } from "@/services/pedidos.service";
import { getErrorMessage } from "@/services/api";
import { soles } from "@/lib/pizzas";
import type { Pedido } from "@/types/pedido";

interface YapeModalProps {
  pedido: Pedido;
  onSubido: (pedido: Pedido) => void;
  onOmitir: () => void;
}

const yapeConfiguracion = {
  titular: import.meta.env.VITE_YAPE_TITULAR?.trim(),
  numero: import.meta.env.VITE_YAPE_NUMERO?.trim(),
  qr: import.meta.env.VITE_YAPE_QR_URL?.trim(),
};
// El número y el QR del PR #4 pertenecen a la cuenta de pruebas del equipo.
// Si se configura algún dato manualmente, exigir el conjunto completo para no mezclar cuentas.
const yapePruebas = import.meta.env.DEV && !Object.values(yapeConfiguracion).some(Boolean);
const YAPE_TITULAR = yapePruebas ? "Cuenta de pruebas del equipo" : yapeConfiguracion.titular;
const YAPE_NUMERO = yapePruebas ? "959 787 947" : yapeConfiguracion.numero;
const YAPE_NUMERO_LIMPIO = YAPE_NUMERO?.replace(/\s/g, "");
const YAPE_QR_URL = yapePruebas ? "/src/assets/yape-pruebas.png" : yapeConfiguracion.qr;
export const yapeConfigurado = Boolean(YAPE_TITULAR && /^9\d{8}$/.test(YAPE_NUMERO_LIMPIO ?? "") && YAPE_QR_URL);

/** Modal de pago Yape: muestra QR + titular y sube el comprobante. */
export function YapeModal({ pedido, onSubido, onOmitir }: YapeModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recibido, setRecibido] = useState<Pedido | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function copiarNumero() {
    if (!YAPE_NUMERO_LIMPIO) return;
    try {
      await navigator.clipboard.writeText(YAPE_NUMERO_LIMPIO);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar el número. Anótalo manualmente.");
    }
  }

  async function subir() {
    if (!archivo) {
      setError("Selecciona la captura de tu Yapeo.");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const actualizado = await PedidosService.subirComprobante(pedido, archivo);
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
            Caja revisará el comprobante del pedido {recibido.codigo} antes de que cocina lo prepare.
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
          <img
            src={YAPE_QR_URL}
            alt="QR Yape de City Pizza"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mt-3 rounded-xl border border-border bg-muted/60 px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Yape
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-lg font-extrabold tracking-wide">{YAPE_NUMERO}</span>
            <button
              type="button"
              onClick={copiarNumero}
              className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Copiar número de Yape"
            >
              {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="mt-1 text-sm">
            Titular: <strong>{YAPE_TITULAR}</strong>
          </p>
        </div>
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
          <Banknote className="h-3.5 w-3.5" /> Adjuntar comprobante más tarde
        </button>
      </div>
    </div>
  );
}
