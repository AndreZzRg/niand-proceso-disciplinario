import { describe, expect, it } from 'vitest';

import { sumarHabiles } from '../lib/fechas';
import {
  ETAPAS,
  SANCIONES,
  etapaPorId,
  lineaDeTiempo,
  nuevoRadicado,
  puedeAvanzar,
  revisarGarantias,
  type Expediente,
} from './proceso';

const HOY = '2026-09-17';

const base = (p: Partial<Expediente> = {}): Expediente => ({
  id: 'e1',
  radicado: 'DIS-2026-001',
  trabajador: 'Trabajador de prueba',
  cargo: 'Auxiliar',
  hechos:
    'El 10 de septiembre de 2026 no se presentó al turno asignado sin aviso previo ni justificación posterior.',
  normaInfringida: 'RIT, capítulo IX, numeral 3',
  fechaHechos: '2026-09-10',
  fechaApertura: '2026-09-11',
  etapa: 'apertura',
  sancion: 'ninguna',
  actuaciones: [],
  cerrado: false,
  ...p,
});

const actuacion = (etapa: Expediente['etapa'], fecha = HOY) => ({
  id: `a-${etapa}`,
  etapa,
  fecha,
  titulo: `Actuación de ${etapa}`,
  detalle: 'Detalle de la actuación.',
  huella: 'abc123',
  registradaEn: `${fecha}T09:00:00.000Z`,
});

describe('catálogo de etapas', () => {
  it('declara norma, entregable y garantía en cada etapa', () => {
    for (const e of ETAPAS) {
      expect(e.norma, e.id).toMatch(/CST|C\. P\.|Sentencia|Reglamento/);
      expect(e.entregable.length, e.id).toBeGreaterThan(15);
      expect(e.garantia.length, e.id).toBeGreaterThan(40);
    }
  });

  it('no deja etapas huérfanas fuera de las terminales', () => {
    for (const e of ETAPAS) {
      if (e.id === 'ejecutoriado' || e.id === 'archivado') {
        expect(e.siguientes, e.id).toHaveLength(0);
      } else {
        expect(e.siguientes.length, e.id).toBeGreaterThan(0);
      }
    }
  });

  it('solo apunta a etapas existentes', () => {
    const ids = new Set(ETAPAS.map((e) => e.id));
    for (const e of ETAPAS) {
      for (const s of e.siguientes) expect(ids.has(s), `${e.id}→${s}`).toBe(true);
    }
  });

  it('rechaza una etapa inexistente', () => {
    // @ts-expect-error se comprueba la defensa en tiempo de ejecución
    expect(() => etapaPorId('inventada')).toThrow(RangeError);
  });
});

describe('transiciones permitidas', () => {
  it('permite el camino ordinario del procedimiento', () => {
    expect(puedeAvanzar('apertura', 'citacion')).toBe(true);
    expect(puedeAvanzar('citacion', 'descargos')).toBe(true);
    expect(puedeAvanzar('descargos', 'decision')).toBe(true);
    expect(puedeAvanzar('decision', 'ejecutoriado')).toBe(true);
  });

  it('permite practicar pruebas entre los descargos y la decisión', () => {
    expect(puedeAvanzar('descargos', 'pruebas')).toBe(true);
    expect(puedeAvanzar('pruebas', 'decision')).toBe(true);
  });

  it('impide saltarse los descargos', () => {
    expect(puedeAvanzar('citacion', 'decision')).toBe(false);
    expect(puedeAvanzar('apertura', 'decision')).toBe(false);
  });

  it('impide retroceder', () => {
    expect(puedeAvanzar('decision', 'descargos')).toBe(false);
    expect(puedeAvanzar('ejecutoriado', 'recurso')).toBe(false);
  });

  it('permite archivar en cualquier etapa anterior a la decisión', () => {
    for (const e of ['apertura', 'citacion', 'descargos', 'pruebas'] as const) {
      expect(puedeAvanzar(e, 'archivado'), e).toBe(true);
    }
  });
});

describe('línea de tiempo', () => {
  it('encadena los términos en días hábiles desde la apertura', () => {
    const hitos = lineaDeTiempo(base(), sumarHabiles);
    expect(hitos).toHaveLength(7);
    expect(hitos[0]!.inicio).toBe('2026-09-11');
    for (let i = 1; i < hitos.length; i++) {
      expect(hitos[i]!.inicio).toBe(hitos[i - 1]!.limite);
      expect(hitos[i]!.limite > hitos[i]!.inicio).toBe(true);
    }
  });

  it('no incluye fines de semana en los límites', () => {
    const hitos = lineaDeTiempo(base(), sumarHabiles);
    for (const h of hitos) {
      const dia = new Date(`${h.limite}T00:00:00`).getDay();
      expect(dia, h.etapa.id).not.toBe(0);
      expect(dia, h.etapa.id).not.toBe(6);
    }
  });

  it('marca como cumplidas las etapas ya superadas', () => {
    const hitos = lineaDeTiempo(base({ etapa: 'decision' }), sumarHabiles);
    expect(hitos.filter((h) => h.cumplida).map((h) => h.etapa.id)).toEqual([
      'apertura',
      'citacion',
      'descargos',
      'pruebas',
    ]);
    expect(hitos.find((h) => h.esActual)!.etapa.id).toBe('decision');
  });

  it('reduce la secuencia a dos hitos cuando se archiva', () => {
    const hitos = lineaDeTiempo(base({ etapa: 'archivado' }), sumarHabiles);
    expect(hitos.map((h) => h.etapa.id)).toEqual(['apertura', 'archivado']);
  });
});

describe('revisión de garantías del debido proceso', () => {
  it('no encuentra nulidades en un expediente bien llevado', () => {
    const e = base({
      etapa: 'decision',
      actuaciones: [actuacion('apertura'), actuacion('citacion'), actuacion('descargos')],
    });
    expect(revisarGarantias(e, HOY).filter((h) => h.gravedad === 'nulidad')).toHaveLength(0);
  });

  it('detecta la decisión sin descargos como nulidad', () => {
    const e = base({
      etapa: 'decision',
      actuaciones: [actuacion('apertura'), actuacion('citacion')],
    });
    const nulidades = revisarGarantias(e, HOY).filter((h) => h.gravedad === 'nulidad');
    expect(nulidades.some((h) => h.norma.includes('art. 115'))).toBe(true);
  });

  it('detecta los descargos sin citación previa', () => {
    const e = base({ etapa: 'descargos', actuaciones: [actuacion('descargos')] });
    expect(
      revisarGarantias(e, HOY).some((h) => h.mensaje.includes('No hay citación registrada')),
    ).toBe(true);
  });

  it('exige una descripción concreta de los hechos', () => {
    const e = base({ hechos: 'Se portó mal' });
    expect(revisarGarantias(e, HOY).some((h) => h.mensaje.includes('de forma concreta'))).toBe(
      true,
    );
  });

  it('exige señalar la norma o cláusula infringida', () => {
    const e = base({ normaInfringida: '  ' });
    expect(revisarGarantias(e, HOY).some((h) => h.norma.includes('arts. 111 y 114'))).toBe(true);
  });

  it('advierte la pérdida de oportunidad de la justa causa', () => {
    const e = base({
      sancion: 'terminacionJustaCausa',
      fechaHechos: '2026-01-10',
      etapa: 'decision',
      actuaciones: [actuacion('citacion'), actuacion('descargos')],
    });
    expect(revisarGarantias(e, HOY).some((h) => h.mensaje.includes('perdón de la falta'))).toBe(
      true,
    );
  });

  it('no advierte oportunidad cuando la actuación es reciente', () => {
    const e = base({
      sancion: 'terminacionJustaCausa',
      fechaHechos: '2026-09-10',
      etapa: 'decision',
      actuaciones: [actuacion('citacion'), actuacion('descargos')],
    });
    expect(revisarGarantias(e, HOY).some((h) => h.mensaje.includes('perdón de la falta'))).toBe(
      false,
    );
  });

  it('recuerda el límite legal de la suspensión', () => {
    const e = base({
      sancion: 'suspension',
      etapa: 'decision',
      actuaciones: [actuacion('citacion'), actuacion('descargos')],
    });
    expect(revisarGarantias(e, HOY).some((h) => h.norma.includes('art. 112'))).toBe(true);
  });

  it('señala la sanción anticipada a la decisión', () => {
    const e = base({ etapa: 'citacion', sancion: 'amonestacionEscrita' });
    expect(revisarGarantias(e, HOY).some((h) => h.mensaje.includes('Anticipar la sanción'))).toBe(
      true,
    );
  });

  it('advierte el expediente sin actuaciones', () => {
    expect(
      revisarGarantias(base(), HOY).some((h) => h.mensaje.includes('no tiene actuaciones')),
    ).toBe(true);
  });
});

describe('catálogo de sanciones', () => {
  it('declara la norma y el límite de cada sanción', () => {
    for (const s of SANCIONES) {
      expect(s.limite.length, s.id).toBeGreaterThan(10);
    }
    expect(SANCIONES.find((s) => s.id === 'suspension')!.norma).toContain('112');
  });
});

describe('radicado', () => {
  it('produce un consecutivo ordenable', () => {
    expect(nuevoRadicado(2026, 1)).toBe('DIS-2026-001');
    expect(nuevoRadicado(2026, 42)).toBe('DIS-2026-042');
    expect(nuevoRadicado(2026, 7) < nuevoRadicado(2026, 12)).toBe(true);
  });
});
