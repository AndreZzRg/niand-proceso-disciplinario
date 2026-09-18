/**
 * Máquina de estados del procedimiento disciplinario laboral.
 *
 * Fundamento:
 * · Constitución Política, art. 29 — debido proceso.
 * · CST art. 115 — el trabajador debe ser oído en descargos antes de que se
 *   imponga cualquier sanción disciplinaria, con asistencia de dos
 *   representantes del sindicato si lo hubiere.
 * · CST arts. 111 a 114 — las sanciones deben estar previstas en el RIT.
 * · Sentencia C-593 de 2014 y T-546 de 2000 — garantías mínimas exigibles en
 *   el proceso disciplinario del sector privado: comunicación de los cargos,
 *   oportunidad de defensa, práctica de pruebas y decisión motivada.
 * · Ley 2466 de 2025 — refuerzo del debido proceso en el reglamento interno.
 *
 * Los términos concretos los fija el Reglamento Interno de Trabajo de cada
 * empresa. Los que se usan aquí son plazos razonables de referencia y se
 * pueden editar: la aplicación no los presenta como término legal.
 */
import type { FechaISO } from '../lib/fechas';

export type Etapa =
  | 'apertura'
  | 'citacion'
  | 'descargos'
  | 'pruebas'
  | 'decision'
  | 'recurso'
  | 'ejecutoriado'
  | 'archivado';

export type Sancion =
  'ninguna' | 'llamadoAtencion' | 'amonestacionEscrita' | 'suspension' | 'terminacionJustaCausa';

export interface DefinicionEtapa {
  readonly id: Etapa;
  readonly rotulo: string;
  readonly descripcion: string;
  /** Qué debe existir al cerrar la etapa para que la actuación sea defendible. */
  readonly entregable: string;
  readonly norma: string;
  /** Días hábiles de referencia para agotar la etapa. */
  readonly diasHabiles: number;
  /** Etapas a las que se puede avanzar desde esta. */
  readonly siguientes: readonly Etapa[];
  readonly garantia: string;
}

export const ETAPAS: readonly DefinicionEtapa[] = [
  {
    id: 'apertura',
    rotulo: 'Apertura',
    descripcion: 'Conocimiento de los hechos y valoración preliminar.',
    entregable: 'Informe de los hechos con fecha, hechos concretos y soportes recibidos.',
    norma: 'CST art. 115 · C. P. art. 29',
    diasHabiles: 3,
    siguientes: ['citacion', 'archivado'],
    garantia:
      'Los hechos deben describirse de forma concreta: fecha, lugar, conducta y norma o cláusula del RIT presuntamente infringida. Una imputación genérica no admite defensa.',
  },
  {
    id: 'citacion',
    rotulo: 'Citación a descargos',
    descripcion: 'Comunicación escrita al trabajador con los cargos formulados.',
    entregable:
      'Citación entregada con constancia de recibo, con fecha, hora y lugar de la diligencia.',
    norma: 'CST art. 115 · Sentencia C-593 de 2014',
    diasHabiles: 5,
    siguientes: ['descargos', 'archivado'],
    garantia:
      'La citación debe entregarse con antelación suficiente para preparar la defensa, enunciar los cargos y advertir el derecho a ser asistido por dos compañeros o por representantes del sindicato.',
  },
  {
    id: 'descargos',
    rotulo: 'Diligencia de descargos',
    descripcion: 'El trabajador es oído y aporta su versión y sus pruebas.',
    entregable: 'Acta de descargos firmada por los asistentes, o constancia de no comparecencia.',
    norma: 'CST art. 115',
    diasHabiles: 1,
    siguientes: ['pruebas', 'decision', 'archivado'],
    garantia:
      'Es la garantía central: sin descargos previos, la sanción es nula con independencia de que la conducta exista. El acta debe recoger lo dicho, no un resumen del empleador.',
  },
  {
    id: 'pruebas',
    rotulo: 'Práctica de pruebas',
    descripcion: 'Se decretan y practican las pruebas pedidas y las de oficio.',
    entregable: 'Auto de pruebas, soportes practicados y traslado al trabajador.',
    norma: 'C. P. art. 29 · Sentencia T-546 de 2000',
    diasHabiles: 10,
    siguientes: ['decision', 'archivado'],
    garantia:
      'Negar una prueba pedida sin motivación es una vía directa a la nulidad. Si se niega, el auto debe decir por qué.',
  },
  {
    id: 'decision',
    rotulo: 'Decisión motivada',
    descripcion: 'Se resuelve absolver o sancionar, con fundamento en lo probado.',
    entregable: 'Acto de decisión motivado, notificado con constancia de recibo.',
    norma: 'CST arts. 111 a 115 · C. P. art. 29',
    diasHabiles: 10,
    siguientes: ['recurso', 'ejecutoriado'],
    garantia:
      'La decisión debe referirse a los cargos formulados, a lo dicho en descargos y a las pruebas. Solo puede imponer sanciones previstas en el RIT.',
  },
  {
    id: 'recurso',
    rotulo: 'Recursos',
    descripcion: 'El trabajador ejerce los recursos que el reglamento contemple.',
    entregable: 'Recurso recibido y decisión que lo resuelve, notificada.',
    norma: 'Reglamento Interno de Trabajo · C. P. art. 29',
    diasHabiles: 5,
    siguientes: ['ejecutoriado'],
    garantia:
      'Si el RIT prevé recurso, omitirlo vicia la actuación. Si no lo prevé, la decisión queda en firme con la notificación.',
  },
  {
    id: 'ejecutoriado',
    rotulo: 'En firme',
    descripcion: 'La decisión quedó ejecutoriada y se ejecuta.',
    entregable: 'Constancia de ejecución y archivo del expediente en el legajo del trabajador.',
    norma: 'CST art. 115',
    diasHabiles: 3,
    siguientes: [],
    garantia:
      'La sanción se ejecuta como fue decidida. Una suspensión no puede exceder el máximo del art. 112 del CST: ocho días la primera vez y dos meses en caso de reincidencia.',
  },
  {
    id: 'archivado',
    rotulo: 'Archivado',
    descripcion: 'La actuación terminó sin sanción.',
    entregable: 'Acto de archivo motivado, comunicado al trabajador.',
    norma: 'C. P. art. 29',
    diasHabiles: 1,
    siguientes: [],
    garantia:
      'El archivo también se motiva y se comunica: deja constancia de que la empresa actuó y cerró.',
  },
] as const;

export function etapaPorId(id: Etapa): DefinicionEtapa {
  const e = ETAPAS.find((x) => x.id === id);
  if (!e) throw new RangeError(`Etapa desconocida: "${id}"`);
  return e;
}

export function puedeAvanzar(desde: Etapa, hacia: Etapa): boolean {
  return etapaPorId(desde).siguientes.includes(hacia);
}

export const SANCIONES: ReadonlyArray<{
  readonly id: Sancion;
  readonly rotulo: string;
  readonly norma: string;
  readonly limite: string;
}> = [
  { id: 'ninguna', rotulo: 'Sin sanción', norma: '—', limite: 'La actuación se archiva.' },
  {
    id: 'llamadoAtencion',
    rotulo: 'Llamado de atención verbal',
    norma: 'RIT',
    limite: 'Debe estar previsto en el reglamento y dejarse por escrito.',
  },
  {
    id: 'amonestacionEscrita',
    rotulo: 'Amonestación escrita',
    norma: 'CST art. 111 · RIT',
    limite: 'Se incorpora al expediente laboral del trabajador.',
  },
  {
    id: 'suspension',
    rotulo: 'Suspensión del contrato',
    norma: 'CST art. 112',
    limite: 'Máximo ocho días la primera vez y dos meses en caso de reincidencia.',
  },
  {
    id: 'terminacionJustaCausa',
    rotulo: 'Terminación con justa causa',
    norma: 'CST art. 62',
    limite:
      'La causal debe estar en el art. 62 del CST o en el RIT y ser oportuna. La tardanza en invocarla equivale a perdonar la falta.',
  },
];

/* ══ Expediente ══════════════════════════════════════════════════ */

export interface Actuacion {
  readonly id: string;
  readonly etapa: Etapa;
  readonly fecha: FechaISO;
  readonly titulo: string;
  readonly detalle: string;
  /** Huella del contenido, para detectar alteración posterior. */
  readonly huella: string;
  readonly registradaEn: string;
}

export interface Expediente {
  readonly id: string;
  readonly radicado: string;
  readonly trabajador: string;
  readonly cargo: string;
  readonly hechos: string;
  readonly normaInfringida: string;
  readonly fechaHechos: FechaISO;
  readonly fechaApertura: FechaISO;
  readonly etapa: Etapa;
  readonly sancion: Sancion;
  readonly actuaciones: readonly Actuacion[];
  readonly cerrado: boolean;
}

export interface Hito {
  readonly etapa: DefinicionEtapa;
  readonly inicio: FechaISO;
  readonly limite: FechaISO;
  readonly cumplida: boolean;
  readonly esActual: boolean;
}

/**
 * Proyecta la línea de tiempo del expediente: a cada etapa le asigna su fecha
 * de inicio estimada y su fecha límite, encadenando los términos en días
 * hábiles desde la apertura.
 */
export function lineaDeTiempo(
  e: Expediente,
  sumarHabiles: (iso: FechaISO, dias: number) => FechaISO,
): readonly Hito[] {
  const secuencia: Etapa[] =
    e.etapa === 'archivado'
      ? ['apertura', 'archivado']
      : ['apertura', 'citacion', 'descargos', 'pruebas', 'decision', 'recurso', 'ejecutoriado'];

  const indiceActual = secuencia.indexOf(e.etapa);
  let cursor = e.fechaApertura;
  const hitos: Hito[] = [];

  for (const [i, id] of secuencia.entries()) {
    const etapa = etapaPorId(id);
    const limite = sumarHabiles(cursor, etapa.diasHabiles);
    hitos.push({
      etapa,
      inicio: cursor,
      limite,
      cumplida: indiceActual > i,
      esActual: indiceActual === i,
    });
    cursor = limite;
  }

  return hitos;
}

/* ══ Validación de garantías ═════════════════════════════════════ */

export interface Hallazgo {
  readonly gravedad: 'nulidad' | 'riesgo' | 'aviso';
  readonly mensaje: string;
  readonly norma: string;
}

/**
 * Revisa el expediente contra las garantías que, omitidas, vician la
 * actuación. No opina sobre el fondo: solo sobre el procedimiento.
 */
export function revisarGarantias(e: Expediente, hoy: FechaISO): readonly Hallazgo[] {
  const hallazgos: Hallazgo[] = [];
  const tiene = (etapa: Etapa) => e.actuaciones.some((a) => a.etapa === etapa);
  const alcanzo = (etapa: Etapa) => {
    const orden: Etapa[] = [
      'apertura',
      'citacion',
      'descargos',
      'pruebas',
      'decision',
      'recurso',
      'ejecutoriado',
    ];
    return orden.indexOf(e.etapa) >= orden.indexOf(etapa);
  };

  if (!e.hechos.trim() || e.hechos.trim().length < 20) {
    hallazgos.push({
      gravedad: 'nulidad',
      mensaje:
        'Los hechos no están descritos de forma concreta. Una imputación genérica impide ejercer la defensa y vicia toda la actuación.',
      norma: 'C. P. art. 29 · Sentencia C-593 de 2014',
    });
  }

  if (!e.normaInfringida.trim()) {
    hallazgos.push({
      gravedad: 'nulidad',
      mensaje:
        'No se indicó la norma o cláusula del reglamento presuntamente infringida. Sin ella no hay cargo que responder.',
      norma: 'CST arts. 111 y 114',
    });
  }

  if (alcanzo('decision') && !tiene('descargos')) {
    hallazgos.push({
      gravedad: 'nulidad',
      mensaje:
        'Se llegó a la decisión sin diligencia de descargos registrada. La sanción sería nula aunque la conducta exista.',
      norma: 'CST art. 115',
    });
  }

  if (alcanzo('descargos') && !tiene('citacion')) {
    hallazgos.push({
      gravedad: 'nulidad',
      mensaje:
        'No hay citación registrada. El trabajador debe conocer los cargos antes de la diligencia.',
      norma: 'CST art. 115 · C. P. art. 29',
    });
  }

  if (e.sancion === 'terminacionJustaCausa') {
    const dias = Math.round(
      (new Date(hoy).getTime() - new Date(e.fechaHechos).getTime()) / 86_400_000,
    );
    if (dias > 60) {
      hallazgos.push({
        gravedad: 'riesgo',
        mensaje: `Han pasado ${dias} días calendario desde los hechos. La jurisprudencia exige oportunidad: la demora prolongada en invocar la justa causa se interpreta como perdón de la falta.`,
        norma: 'CST art. 62 · jurisprudencia laboral reiterada',
      });
    }
  }

  if (e.sancion === 'suspension') {
    hallazgos.push({
      gravedad: 'aviso',
      mensaje:
        'La suspensión no puede exceder ocho días la primera vez ni dos meses en caso de reincidencia.',
      norma: 'CST art. 112',
    });
  }

  if (e.etapa !== 'archivado' && e.sancion !== 'ninguna' && !alcanzo('decision')) {
    hallazgos.push({
      gravedad: 'riesgo',
      mensaje:
        'Hay una sanción registrada antes de llegar a la etapa de decisión. Anticipar la sanción convierte los descargos en un trámite y así lo leerá un juez.',
      norma: 'C. P. art. 29',
    });
  }

  if (e.actuaciones.length === 0) {
    hallazgos.push({
      gravedad: 'aviso',
      mensaje:
        'El expediente no tiene actuaciones registradas. Lo que no está documentado no ocurrió para efectos probatorios.',
      norma: 'CST art. 115',
    });
  }

  return hallazgos;
}

/** Radicado legible y ordenable: DIS-AAAA-NNN. */
export function nuevoRadicado(anio: number, consecutivo: number): string {
  return `DIS-${anio}-${String(consecutivo).padStart(3, '0')}`;
}
