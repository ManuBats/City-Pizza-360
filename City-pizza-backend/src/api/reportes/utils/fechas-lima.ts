/**
 * Utilidades de fecha para el negocio (America/Lima, UTC-5 todo el año).
 * Las claves de día siempre son YYYY-MM-DD en hora local, nunca en UTC.
 */
const ZONA_HORARIA = 'America/Lima';
const OFFSET_LIMA = '-05:00';
const MS_POR_DIA = 86_400_000;

function partesEnLima(fecha: Date) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const valor = (tipo: 'year' | 'month' | 'day') =>
    partes.find((p) => p.type === tipo)?.value ?? '';
  return { anio: valor('year'), mes: valor('month'), dia: valor('day') };
}

/** Día calendario en Lima para un instante dado (YYYY-MM-DD). */
export function claveDiaLima(fecha: Date): string {
  const { anio, mes, dia } = partesEnLima(fecha);
  return `${anio}-${mes}-${dia}`;
}

/** Valida formato y existencia real de una fecha YYYY-MM-DD. */
export function fechaISOValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    d.getUTCFullYear() === anio &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

/** Suma (o resta) días a una fecha YYYY-MM-DD sin cruzar zonas horarias. */
export function sumarDiasISO(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Instante UTC en que empieza el día local (00:00 en Lima = 05:00 UTC). */
export function inicioDiaLima(fecha: string): Date {
  return new Date(`${fecha}T00:00:00${OFFSET_LIMA}`);
}

/** Instante UTC en que termina el día local (exclusivo). */
export function finDiaLimaExclusivo(fecha: string): Date {
  return new Date(inicioDiaLima(fecha).getTime() + MS_POR_DIA);
}

/** Diferencia en días calendario entre dos fechas YYYY-MM-DD. */
export function diasEntre(desde: string, hasta: string): number {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  return Math.round((b - a) / MS_POR_DIA);
}
