/** Fechas del negocio en America/Lima (UTC-5 todo el año). */

const ZONA_HORARIA = "America/Lima";

function partesEnLima(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const valor = (tipo: "year" | "month" | "day") =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return { anio: valor("year"), mes: valor("month"), dia: valor("day") };
}

/** Día actual en Lima como YYYY-MM-DD. */
export function fechaLimaISO(fecha = new Date()): string {
  const { anio, mes, dia } = partesEnLima(fecha);
  return `${anio}-${mes}-${dia}`;
}

/** Suma (o resta) días a una fecha YYYY-MM-DD sin cruzar zonas horarias. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Rango de los últimos N días, incluyendo hoy. */
export function rangoUltimosDias(dias: number): { desde: string; hasta: string } {
  const hasta = fechaLimaISO();
  return { desde: sumarDias(hasta, -(dias - 1)), hasta };
}

/** 2026-11-11 -> 11/11 */
export function formatearFechaCorta(fechaISO: string): string {
  const [, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}`;
}

/** 2026-11-11 -> 11/11/2026 */
export function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}
