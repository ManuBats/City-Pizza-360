import {
  SIGUIENTE_ESTADO,
  faltaStock,
  type PizzaConReceta,
} from './pedidos.service';

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

const PIZZAS: PizzaConReceta[] = [
  {
    id: 1,
    nombre: 'Hawaiana',
    insumos: [
      {
        insumoId: 1,
        insumoNombre: 'Queso mozzarella',
        stock: 2,
        cantidad: 0.15,
      },
      { insumoId: 3, insumoNombre: 'Jamón', stock: 6, cantidad: 0.15 },
    ],
  },
  {
    id: 99,
    nombre: 'Futura Especial',
    insumos: [
      { insumoId: 2, insumoNombre: 'Pepperoni', stock: 0.1, cantidad: 0.15 },
    ],
  },
];

describe('Sin stock no hay venta (todas las pizzas)', () => {
  it('stock suficiente → null', () => {
    expect(
      faltaStock(PIZZAS, [
        { pizzaId: 1, nombrePizza: 'Hawaiana', cantidad: 2 },
      ]),
    ).toBeNull();
  });

  it('Hawaiana sin queso → mensaje emblema', () => {
    const sinQueso: PizzaConReceta[] = [
      {
        ...PIZZAS[0],
        insumos: [
          {
            insumoId: 1,
            insumoNombre: 'Queso mozzarella',
            stock: 0.05,
            cantidad: 0.15,
          },
        ],
      },
    ];
    expect(
      faltaStock(sinQueso, [
        { pizzaId: 1, nombrePizza: 'Hawaiana', cantidad: 1 },
      ]),
    ).toBe('Sin queso no hay Hawaiana');
  });

  it('pizza futura sin stock → mensaje genérico con nombres', () => {
    expect(
      faltaStock(PIZZAS, [
        { pizzaId: 99, nombrePizza: 'Futura Especial', cantidad: 1 },
      ]),
    ).toBe('Sin stock suficiente de Pepperoni para Futura Especial');
  });

  it('la cantidad multiplica el consumo', () => {
    expect(
      faltaStock(PIZZAS, [
        { pizzaId: 1, nombrePizza: 'Hawaiana', cantidad: 100 },
      ]),
    ).not.toBeNull();
  });
});
