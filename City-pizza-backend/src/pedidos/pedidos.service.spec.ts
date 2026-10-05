import { SIGUIENTE_ESTADO } from './pedidos.service';

describe('Máquina de estados del pedido', () => {
  it('Recibido→Preparacion→Listo→EnCamino→Entregado', () => {
    expect(SIGUIENTE_ESTADO['Recibido']).toBe('Preparacion');
    expect(SIGUIENTE_ESTADO['Preparacion']).toBe('Listo');
    expect(SIGUIENTE_ESTADO['Listo']).toBe('EnCamino');
    expect(SIGUIENTE_ESTADO['EnCamino']).toBe('Entregado');
  });

  it('Entregado es terminal (400 ante cualquier transición)', () => {
    expect(SIGUIENTE_ESTADO['Entregado']).toBeNull();
  });
});
