import type { PrismaService } from '../../../config/prisma/prisma.service';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  const pedidoFindMany = jest.fn();
  const prisma = {
    pedido: { findMany: pedidoFindMany, count: jest.fn() },
    insumo: { findMany: jest.fn() },
    detallePedido: { groupBy: jest.fn() },
    pizza: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const service = new ReportesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agrupa las ventas por día local de Lima', async () => {
    pedidoFindMany.mockResolvedValue([
      // 10 nov 2026 21:30 en Lima (11 nov 02:30 UTC).
      { creadoEn: new Date('2026-11-11T02:30:00.000Z'), total: 50 },
      // 11 nov 2026 10:00 en Lima.
      { creadoEn: new Date('2026-11-11T15:00:00.000Z'), total: 70 },
    ]);

    const resultado = await service.ventasPorDia({
      desde: '2026-11-10',
      hasta: '2026-11-11',
    });

    expect(resultado).toEqual([
      { fecha: '2026-11-10', pedidos: 1, ventas: 50 },
      { fecha: '2026-11-11', pedidos: 1, ventas: 70 },
    ]);
    expect(pedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          creadoEn: {
            gte: new Date('2026-11-10T05:00:00.000Z'),
            lt: new Date('2026-11-12T05:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('rechaza un rango invertido', async () => {
    await expect(
      service.ventasPorDia({ desde: '2026-11-12', hasta: '2026-11-11' }),
    ).rejects.toThrow('"desde" no puede ser mayor que "hasta".');
  });

  it('rechaza rangos mayores a 90 días', async () => {
    await expect(
      service.ventasPorDia({ desde: '2026-01-01', hasta: '2026-12-31' }),
    ).rejects.toThrow('El rango máximo es de 90 días.');
  });
});
