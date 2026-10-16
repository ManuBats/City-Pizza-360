import { a2Decimales, aNumero, serializarInsumo, serializarPedido, serializarPizza, serializarPromocion } from './serializar';

describe('Serialización Decimal → number', () => {
  it('aNumero acepta number, string y Decimal-like', () => {
    expect(aNumero(28)).toBe(28);
    expect(aNumero('28')).toBe(28);
    expect(aNumero({ toString: () => '28.5' })).toBe(28.5);
  });

  it('serializarPedido normaliza total, detalles y pizza', () => {
    const out = serializarPedido({
      total: '28',
      detalles: [
        { precioUnit: '28', pizza: { precio: '32', precioPersonal: '18', precioMediana: '25', precioFamiliar: '32' } },
      ],
    });
    expect(out.total).toBe(28);
    expect(out.detalles[0].precioUnit).toBe(28);
    expect(out.detalles[0].pizza.precioMediana).toBe(25);
  });

  it('serializarPizza y serializarPromocion normalizan precios', () => {
    expect(serializarPizza({ precio: '32' }).precio).toBe(32);
    expect(serializarPromocion({ precioPromo: '58' }).precioPromo).toBe(58);
  });

  it('a2Decimales corta artefactos de flotantes', () => {
    expect(a2Decimales(6.799999999999997)).toBe(6.8);
    expect(a2Decimales(7.149999999999999)).toBe(7.15);
    expect(a2Decimales(3.25)).toBe(3.25);
    expect(a2Decimales(18)).toBe(18);
  });

  it('serializarInsumo redondea stock y minimo', () => {
    expect(serializarInsumo({ stock: 6.799999999999997, stockMinimo: 3 })).toEqual({
      stock: 6.8,
      stockMinimo: 3,
    });
  });
});
