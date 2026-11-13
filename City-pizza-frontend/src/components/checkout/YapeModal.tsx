import { useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, Upload, X } from "lucide-react";
import { getErrorMessage } from "@/services/api";
import { soles } from "@/lib/pizzas";
import type { Pedido } from "@/types/pedido";
import { AccionesSeguimiento } from "@/components/checkout/AccionesSeguimiento";

interface YapeModalProps {
  total: number;
  onConfirmar: (archivo: File) => Promise<Pedido | null>;
  onSubido: (pedido: Pedido) => void;
  onCerrar: () => void;
  reemplazo?: boolean;
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
export function YapeModal({ total, onConfirmar, onSubido, onCerrar, reemplazo = false }: YapeModalProps) {
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
      const pedido = await onConfirmar(archivo);
      if (pedido) setRecibido(pedido);
      else setError("Revisa los datos de tu pedido antes de continuar.");
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
          <AccionesSeguimiento pedido={recibido} />
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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-yape" className="card-soft relative w-full max-w-sm p-6 pt-12 text-center">
        <button type="button" onClick={onCerrar} disabled={subiendo} aria-label="Cerrar pago Yape"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-40">
          <X className="h-5 w-5" />
        </button>
        <h2 id="titulo-yape" className="mt-1 text-2xl font-extrabold">
          {reemplazo ? "Adjunta tu comprobante Yape" : `Paga ${soles(total)} por Yape`}
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
          disabled={subiendo || !archivo}
          className="btn-tactile mt-3 w-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {subiendo ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
            </span>
          ) : (
            reemplazo ? "Enviar comprobante" : "Enviar comprobante y confirmar pedido"
          )}
        </button>
      </div>
    </div>
  );
}
