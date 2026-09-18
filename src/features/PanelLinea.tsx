/**
 * Módulo «Línea de tiempo y términos»: proyección del procedimiento en días
 * hábiles y revisión de las garantías del debido proceso.
 */
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Boton, Insignia, Llamado, Tarjeta, Vacio, cx, type Tono } from '../brand/ui';
import { etapaPorId, lineaDeTiempo, puedeAvanzar, revisarGarantias } from '../domain/proceso';
import { estadoPlazo, sumarHabiles } from '../lib/fechas';
import { fechaLarga, plural } from '../lib/formato';
import { useEstado, useExpediente } from '../store';

const TONO_GRAVEDAD: Record<'nulidad' | 'riesgo' | 'aviso', Tono> = {
  nulidad: 'riesgo',
  riesgo: 'alerta',
  aviso: 'info',
};

const ROTULO_GRAVEDAD = {
  nulidad: 'Vicia la actuación',
  riesgo: 'Riesgo',
  aviso: 'Aviso',
} as const;

export function PanelLinea() {
  const { hoy, avanzar } = useEstado();
  const e = useExpediente();

  if (!e) {
    return (
      <Vacio titulo="Seleccione un expediente">
        Vaya al módulo <strong>Expedientes</strong> y elija uno para ver su línea de tiempo.
      </Vacio>
    );
  }

  const hitos = lineaDeTiempo(e, sumarHabiles);
  const hallazgos = revisarGarantias(e, hoy);
  const nulidades = hallazgos.filter((h) => h.gravedad === 'nulidad');
  const etapaActual = etapaPorId(e.etapa);

  return (
    <div className="space-y-6">
      <Tarjeta
        titulo={`${e.radicado} · ${e.trabajador}`}
        descripcion={`Apertura: ${fechaLarga(e.fechaApertura)} · etapa actual: ${etapaActual.rotulo}`}
        acciones={
          <div className="flex flex-wrap gap-2">
            {etapaActual.siguientes.map((s) => (
              <Boton
                key={s}
                tamano="sm"
                variante={s === 'archivado' ? 'secundario' : 'primario'}
                disabled={!puedeAvanzar(e.etapa, s)}
                onClick={() => avanzar(e.id, s)}
              >
                {etapaPorId(s).rotulo} <ArrowRight size={13} />
              </Boton>
            ))}
          </div>
        }
      >
        <ol className="space-y-0">
          {hitos.map((h, i) => {
            const estado = estadoPlazo(h.limite, hoy);
            const tono: Tono = h.cumplida
              ? 'ok'
              : h.esActual
                ? estado === 'vencido'
                  ? 'riesgo'
                  : estado === 'critico'
                    ? 'alerta'
                    : 'marca'
                : 'neutro';
            return (
              <li key={h.etapa.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cx(
                      'mt-1 grid size-7 shrink-0 place-items-center rounded-full border-2 font-mono text-xs font-semibold',
                      h.cumplida
                        ? 'border-senal bg-senal text-white'
                        : h.esActual
                          ? 'border-marca text-marca'
                          : 'border-borde text-texto-3',
                    )}
                  >
                    {h.cumplida ? '✓' : i + 1}
                  </span>
                  {i < hitos.length - 1 && (
                    <span
                      className={cx('w-0.5 flex-1', h.cumplida ? 'bg-senal/40' : 'bg-borde')}
                      aria-hidden
                    />
                  )}
                </div>

                <div
                  className={cx('min-w-0 flex-1 pb-6', !h.cumplida && !h.esActual && 'opacity-60')}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-semibold">{h.etapa.rotulo}</h3>
                    <Insignia tono={tono}>
                      {h.cumplida ? 'cumplida' : `límite ${fechaLarga(h.limite)}`}
                    </Insignia>
                    {h.esActual && estado === 'vencido' && (
                      <Insignia tono="riesgo">término vencido</Insignia>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-texto-2">{h.etapa.descripcion}</p>
                  <p className="mt-1.5 text-xs text-texto-2">
                    <strong>Entregable:</strong> {h.etapa.entregable}
                  </p>
                  <p className="eyebrow mt-1">
                    {h.etapa.norma} · {plural(h.etapa.diasHabiles, 'día hábil', 'días hábiles')}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-marca">
                      Garantía que protege esta etapa
                    </summary>
                    <p className="mt-1.5 text-sm text-texto-2">{h.etapa.garantia}</p>
                  </details>
                </div>
              </li>
            );
          })}
        </ol>
      </Tarjeta>

      <Tarjeta
        titulo="Revisión de garantías"
        descripcion="Revisa el procedimiento, no el fondo del asunto."
      >
        {hallazgos.length === 0 ? (
          <Llamado tono="ok" icono={<ShieldCheck size={18} />} titulo="Sin hallazgos">
            El expediente cumple las garantías verificables en esta etapa. Eso no prejuzga el fondo:
            que el procedimiento sea correcto no significa que la falta esté probada.
          </Llamado>
        ) : (
          <div className="space-y-3">
            {hallazgos.map((h) => (
              <Llamado
                key={h.mensaje}
                tono={TONO_GRAVEDAD[h.gravedad]}
                titulo={ROTULO_GRAVEDAD[h.gravedad]}
                icono={<ShieldAlert size={18} />}
              >
                <p>{h.mensaje}</p>
                <p className="eyebrow mt-1.5">{h.norma}</p>
              </Llamado>
            ))}
          </div>
        )}

        {nulidades.length > 0 && (
          <p className="mt-4 border-t border-borde pt-4 text-sm text-texto-2">
            Con {plural(nulidades.length, 'nulidad detectada', 'nulidades detectadas')}, una sanción
            impuesta en este expediente es atacable con independencia de que la conducta haya
            ocurrido. Corrija el procedimiento antes de decidir.
          </p>
        )}
      </Tarjeta>
    </div>
  );
}
