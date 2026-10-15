import { EXTRA_QUESO_PRECIO, precioLinea, precioPorTamano } from './precios';

describe('Reglas de precio', () => {
  const pizza = { precioPersonal: 18, precioMediana: 25, precioFamiliar: 32 };

  it('precio por tamaño', () => {
    expect(precioPorTamano(pizza, 'Personal')).toBe(18);
    expect(precioPorTamano(pizza, 'Mediana')).toBe(25);
    expect(precioPorTamano(pizza, 'Familiar')).toBe(32);
  });

  it('extra queso suma +S/3 a la línea', () => {
    expect(EXTRA_QUESO_PRECIO).toBe(3);
    expect(precioLinea(pizza, 'Personal', false)).toBe(18);
    expect(precioLinea(pizza, 'Personal', true)).toBe(21);
    expect(precioLinea(pizza, 'Familiar', true)).toBe(35);
  });
});
