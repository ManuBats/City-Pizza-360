/** Serializa Decimals de Prisma a number en respuestas JSON (puro, testeable). */
export function aNumero(v: unknown): number {
  return typeof v === 'number' ? v : Number(String(v));
}

/** Redondea a 2 decimales (evita 6.799999999999997 en stocks/pesos). */
export function a2Decimales(v: unknown): number {
  return Math.round(Number(String(v)) * 100) / 100;
}

export function serializarPizza<T extends object>(pizza: T): T {
  const p = pizza as Record<string, unknown>;
  return {
    ...p,
    precio: aNumero(p.precio),
    precioPersonal: aNumero(p.precioPersonal),
    precioMediana: aNumero(p.precioMediana),
    precioFamiliar: aNumero(p.precioFamiliar),
  } as T;
}

export function serializarPedido<T extends object>(pedido: T): T {
  const p = pedido as Record<string, unknown> & {
    detalles?: Array<Record<string, unknown>>;
  };
  return {
    ...p,
    total: aNumero(p.total),
    ...(Array.isArray(p.detalles)
      ? {
          detalles: p.detalles.map((d) => ({
            ...d,
            precioUnit: aNumero(d.precioUnit),
            ...(d.pizza && typeof d.pizza === 'object'
              ? { pizza: serializarPizza(d.pizza) }
              : {}),
          })),
        }
      : {}),
  } as T;
}

export function serializarPromocion<T extends object>(promo: T): T {
  const p = promo as Record<string, unknown>;
  return { ...p, precioPromo: aNumero(p.precioPromo) } as T;
}

export function serializarInsumo<T extends object>(insumo: T): T {
  const i = insumo as Record<string, unknown>;
  return { ...i, stock: a2Decimales(i.stock), stockMinimo: a2Decimales(i.stockMinimo) } as T;
}
