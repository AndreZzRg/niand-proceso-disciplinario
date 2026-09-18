/**
 * Módulo «Generador de actos»: borradores de citación, acta de descargos y
 * decisión, construidos con los datos del expediente.
 *
 * Los borradores son modelos base. Requieren adaptación profesional al caso
 * concreto antes de usarse: así lo exige la regla editorial de NiAnd Labs.
 */
import { useState } from 'react';
import { Copy, Download, FileText } from 'lucide-react';

import { Boton, Llamado, Seleccion, Tarjeta, Vacio } from '../brand/ui';
import { SANCIONES, etapaPorId } from '../domain/proceso';
import { exportarTexto } from '../lib/exportar';
import { sumarHabiles } from '../lib/fechas';
import { fechaLarga } from '../lib/formato';
import { useEstado, useExpediente } from '../store';

type TipoActo = 'citacion' | 'acta' | 'decision' | 'archivo';

const TIPOS: ReadonlyArray<[TipoActo, string]> = [
  ['citacion', 'Citación a descargos'],
  ['acta', 'Acta de diligencia de descargos'],
  ['decision', 'Decisión motivada'],
  ['archivo', 'Acto de archivo'],
];

const ADVERTENCIA = [
  '> **Modelo base.** Este borrador se generó de forma automática a partir de los datos',
  '> del expediente y **requiere adaptación profesional al caso concreto** antes de usarse.',
  '> No constituye concepto jurídico. Verifique que las causales y los términos correspondan',
  '> al Reglamento Interno de Trabajo vigente de la empresa.',
  '',
].join('\n');

export function PanelActos() {
  const { hoy } = useEstado();
  const e = useExpediente();
  const [tipo, setTipo] = useState<TipoActo>('citacion');
  const [copiado, setCopiado] = useState(false);

  if (!e) {
    return (
      <Vacio titulo="Seleccione un expediente">
        Los actos se generan con los datos de un expediente concreto.
      </Vacio>
    );
  }

  const sancion = SANCIONES.find((s) => s.id === e.sancion)!;
  const encabezado = [
    ADVERTENCIA,
    `**Radicado:** ${e.radicado}  `,
    `**Trabajador:** ${e.trabajador}${e.cargo ? ` — ${e.cargo}` : ''}  `,
    `**Fecha:** ${fechaLarga(hoy)}`,
    '',
    '---',
    '',
  ].join('\n');

  const cuerpos: Record<TipoActo, string> = {
    citacion: [
      '# Citación a diligencia de descargos',
      '',
      `Respetado(a) señor(a) **${e.trabajador}**:`,
      '',
      'En cumplimiento del artículo 115 del Código Sustantivo del Trabajo y del artículo 29 de la',
      'Constitución Política, se le cita a diligencia de descargos para que exponga su versión',
      'sobre los siguientes hechos:',
      '',
      `> ${e.hechos}`,
      '',
      `Los hechos anteriores podrían constituir una infracción a: **${e.normaInfringida || '[indicar norma o cláusula del RIT]'}**.`,
      '',
      '## Datos de la diligencia',
      '',
      `- **Fecha:** ${fechaLarga(sumarHabiles(hoy, 5))}`,
      '- **Hora:** [indicar]',
      '- **Lugar:** [indicar]',
      '',
      '## Sus derechos en la diligencia',
      '',
      '1. Ser asistido por dos compañeros de trabajo o, si existe sindicato, por dos de sus',
      '   representantes (CST, art. 115).',
      '2. Conocer los hechos que se le imputan antes de la diligencia; por eso constan arriba.',
      '3. Aportar y solicitar las pruebas que estime pertinentes.',
      '4. Guardar silencio, sin que ello se tome como aceptación de los hechos.',
      '',
      'Se le concede un plazo razonable para preparar su defensa. La no comparecencia se dejará',
      'constar y el procedimiento continuará con las garantías de ley.',
      '',
      'Atentamente,',
      '',
      '________________________________',
      '[Nombre y cargo de quien cita]',
    ].join('\n'),

    acta: [
      '# Acta de diligencia de descargos',
      '',
      `En [ciudad], el ${fechaLarga(hoy)}, siendo las [hora], se dio inicio a la diligencia de`,
      `descargos de **${e.trabajador}**, dentro del expediente **${e.radicado}**.`,
      '',
      '## Asistentes',
      '',
      '| Nombre | Cargo o calidad | Firma |',
      '|---|---|---|',
      `| ${e.trabajador} | Trabajador | |`,
      '| | Representante del empleador | |',
      '| | Acompañante del trabajador | |',
      '',
      '## Hechos puestos en conocimiento',
      '',
      `> ${e.hechos}`,
      '',
      `**Norma o cláusula presuntamente infringida:** ${e.normaInfringida || '[indicar]'}`,
      '',
      '## Versión del trabajador',
      '',
      '[Transcribir lo manifestado por el trabajador. Debe recogerse lo dicho, no un resumen',
      'del empleador: el acta es la prueba de que fue oído.]',
      '',
      '## Pruebas solicitadas',
      '',
      '[Enunciar las pruebas pedidas y, si alguna se niega, la motivación de la negativa.]',
      '',
      '## Cierre',
      '',
      'Siendo las [hora] se da por terminada la diligencia. Se lee el acta a los asistentes,',
      'quienes la firman en constancia de conformidad con su contenido.',
      '',
      '________________________________    ________________________________',
      `${e.trabajador}                      [Representante del empleador]`,
    ].join('\n'),

    decision: [
      '# Decisión dentro del procedimiento disciplinario',
      '',
      `**Expediente:** ${e.radicado}`,
      '',
      '## 1. Hechos investigados',
      '',
      `> ${e.hechos}`,
      '',
      '## 2. Actuaciones surtidas',
      '',
      ...(e.actuaciones.length > 0
        ? e.actuaciones.map(
            (a) => `- ${fechaLarga(a.fecha)} — ${etapaPorId(a.etapa).rotulo}: ${a.titulo}`,
          )
        : ['- [No hay actuaciones registradas en el expediente.]']),
      '',
      '## 3. Descargos del trabajador',
      '',
      '[Sintetizar la versión rendida y pronunciarse sobre cada argumento. Una decisión que no',
      'se refiere a lo dicho en descargos es una decisión sin motivación.]',
      '',
      '## 4. Valoración de las pruebas',
      '',
      '[Indicar qué se probó, con qué prueba y por qué se le da o se le niega mérito.]',
      '',
      '## 5. Fundamento normativo',
      '',
      `- ${e.normaInfringida || '[Norma o cláusula del RIT]'}`,
      `- ${sancion.norma}`,
      '',
      '## 6. Decisión',
      '',
      `Se resuelve imponer: **${sancion.rotulo}**.`,
      '',
      `> ${sancion.limite}`,
      '',
      '## 7. Recursos',
      '',
      '[Indicar si el Reglamento Interno de Trabajo prevé recurso, ante quién y en qué término.',
      'Si lo prevé y se omite, la actuación queda viciada.]',
      '',
      '________________________________',
      '[Nombre y cargo de quien decide]',
      '',
      '**Notificación.** Recibí copia el ____ de __________ de ______.',
      '',
      '________________________________',
      e.trabajador,
    ].join('\n'),

    archivo: [
      '# Acto de archivo',
      '',
      `Dentro del expediente **${e.radicado}**, seguido frente a **${e.trabajador}**, y`,
      'analizados los hechos y las pruebas recaudadas, se dispone **el archivo de la actuación**',
      'por las siguientes razones:',
      '',
      '[Motivar: los hechos no ocurrieron, no constituyen falta, no están probados, o la',
      'conducta no está tipificada en el reglamento.]',
      '',
      'El archivo se comunica al trabajador y se deja constancia en su expediente laboral de que',
      'la actuación terminó sin sanción.',
      '',
      '________________________________',
      '[Nombre y cargo]',
    ].join('\n'),
  };

  const texto = encabezado + cuerpos[tipo];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // El portapapeles puede estar bloqueado; el usuario siempre puede descargar.
    }
  };

  return (
    <div className="space-y-6">
      <Llamado tono="alerta" titulo="Estos borradores son modelos base">
        Se generan con los datos del expediente y{' '}
        <strong>requieren adaptación profesional al caso concreto</strong>. No constituyen concepto
        jurídico. Antes de usarlos, contraste las causales y los términos con el Reglamento Interno
        de Trabajo vigente de la empresa.
      </Llamado>

      <Tarjeta
        titulo="Generador de actos"
        descripcion={`${e.radicado} · ${e.trabajador}`}
        acciones={
          <>
            <Boton variante="secundario" tamano="sm" onClick={() => void copiar()}>
              <Copy size={14} /> {copiado ? 'Copiado' : 'Copiar'}
            </Boton>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => exportarTexto(texto, tipo, 'md')}
            >
              <Download size={14} /> Markdown
            </Boton>
          </>
        }
      >
        <div className="mb-4 max-w-sm">
          <Seleccion value={tipo} onChange={(ev) => setTipo(ev.target.value as TipoActo)}>
            {TIPOS.map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </Seleccion>
        </div>

        <pre className="max-h-[32rem] overflow-auto rounded-xl border border-borde bg-superficie-3 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {texto}
        </pre>

        <p className="mt-3 flex items-center gap-2 text-xs text-texto-3">
          <FileText size={14} /> El borrador se arma en su navegador. No se envía a ningún servidor.
        </p>
      </Tarjeta>
    </div>
  );
}
