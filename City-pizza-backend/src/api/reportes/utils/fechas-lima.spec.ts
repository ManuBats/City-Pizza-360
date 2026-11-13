import {
  claveDiaLima,
  diasEntre,
  fechaISOValida,
  finDiaLimaExclusivo,
  inicioDiaLima,
  sumarDiasISO,
} from './fechas-lima';

describe('fechas-lima', () => {
  it('usa el día local de Lima, no el día UTC', () => {
    // 11 nov 2026 02:30 UTC = 10 nov 2026 21:30 en Lima.
    expect(claveDiaLima(new Date('2026-11-11T02:30:00.000Z'))).toBe(
      '2026-11-10',
    );
    expect(claveDiaLima(new Date('2026-11-11T05:00:00.000Z'))).toBe(
      '2026-11-11',
    );
  });

  it('calcula los límites UTC del día local', () => {
    expect(inicioDiaLima('2026-11-11').toISOString()).toBe(
      '2026-11-11T05:00:00.000Z',
    );
    expect(finDiaLimaExclusivo('2026-11-11').toISOString()).toBe(
      '2026-11-12T05:00:00.000Z',
    );
  });

  it('suma días cruzando mes y año', () => {
    expect(sumarDiasISO('2026-11-30', 1)).toBe('2026-12-01');
    expect(sumarDiasISO('2027-01-01', -1)).toBe('2026-12-31');
    expect(diasEntre('2026-11-01', '2026-11-07')).toBe(6);
  });

  it('valida fechas reales, no solo el formato', () => {
    expect(fechaISOValida('2026-02-28')).toBe(true);
    expect(fechaISOValida('2026-02-31')).toBe(false);
    expect(fechaISOValida('11/11/2026')).toBe(false);
  });
});
