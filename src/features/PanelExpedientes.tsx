/**
 * Módulo «Expedientes»: creación, selección y edición de la carátula.
 */
import { useState } from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';

import {
  AreaTexto,
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Llamado,
  Tarjeta,
  Vacio,
  cx,
} from '../brand/ui';
import { ETAPAS, SANCIONES, etapaPorId, revisarGarantias } from '../domain/proceso';
import type { Sancion } from '../domain/proceso';
import { fechaLarga } from '../lib/formato';
import { useEstado, useExpediente } from '../store';

export function PanelExpedientes() {
  const { expedientes, hoy, crear, actualizar, eliminar, seleccionar, fijarSancion, setHoy } =
    useEstado();
  const actual = useExpediente();

  const [nuevo, setNuevo] = useState({
    trabajador: '',
    cargo: '',
    hechos: '',
    normaInfringida: '',
    fechaHechos: hoy,
  });

  const puedeCrear = nuevo.trabajador.trim().length > 2 && nuevo.hechos.trim().length > 20;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Expedientes" valor={expedientes.length} />
        <Dato
          rotulo="En trámite"
          valor={expedientes.filter((e) => !e.cerrado).length}
          tono="marca"
        />
        <Dato rotulo="Cerrados" valor={expedientes.filter((e) => e.cerrado).length} tono="ok" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Tarjeta
          titulo="Abrir expediente"
          descripcion="La carátula fija los cargos que se van a debatir."
        >
          <div className="space-y-4">
            <Campo etiqueta="Trabajador" requerido>
              {(id) => (
                <Entrada
                  id={id}
                  value={nuevo.trabajador}
                  onChange={(e) => setNuevo({ ...nuevo, trabajador: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Cargo">
              {(id) => (
                <Entrada
                  id={id}
                  value={nuevo.cargo}
                  onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Fecha de los hechos" requerido>
              {(id) => (
                <Entrada
                  id={id}
                  type="date"
                  value={nuevo.fechaHechos}
                  onChange={(e) => setNuevo({ ...nuevo, fechaHechos: e.target.value })}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Hechos"
              requerido
              ayuda="Fecha, lugar y conducta concreta. Una imputación genérica impide la defensa."
              error={
                nuevo.hechos.length > 0 && nuevo.hechos.trim().length <= 20
                  ? 'Describa los hechos con al menos una frase completa.'
                  : null
              }
            >
              {(id) => (
                <AreaTexto
                  id={id}
                  rows={4}
                  value={nuevo.hechos}
                  placeholder="El 10 de septiembre de 2026, en la sede norte, no se presentó al turno de las 6:00 a. m. sin aviso previo…"
                  onChange={(e) => setNuevo({ ...nuevo, hechos: e.target.value })}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Norma o cláusula presuntamente infringida"
              ayuda="Artículo del CST o numeral del Reglamento Interno de Trabajo."
            >
              {(id) => (
                <Entrada
                  id={id}
                  value={nuevo.normaInfringida}
                  placeholder="RIT, capítulo IX, numeral 3"
                  onChange={(e) => setNuevo({ ...nuevo, normaInfringida: e.target.value })}
                />
              )}
            </Campo>

            <Boton
              disabled={!puedeCrear}
              onClick={() => {
                crear(nuevo);
                setNuevo({
                  trabajador: '',
                  cargo: '',
                  hechos: '',
                  normaInfringida: '',
                  fechaHechos: hoy,
                });
              }}
            >
              <FolderPlus size={15} /> Abrir expediente
            </Boton>
          </div>

          <div className="mt-6 border-t border-borde pt-4">
            <Campo etiqueta="Fecha de trabajo" ayuda="Se usa para calcular los términos.">
              {(id) => (
                <Entrada id={id} type="date" value={hoy} onChange={(e) => setHoy(e.target.value)} />
              )}
            </Campo>
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta titulo="Expedientes abiertos">
            {expedientes.length === 0 ? (
              <Vacio titulo="Aún no hay expedientes">
                Abra el primero con el formulario de la izquierda.
              </Vacio>
            ) : (
              <ul className="space-y-2">
                {expedientes.map((e) => {
                  const etapa = etapaPorId(e.etapa);
                  const nulidades = revisarGarantias(e, hoy).filter(
                    (h) => h.gravedad === 'nulidad',
                  ).length;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => seleccionar(e.id)}
                        aria-current={e.id === actual?.id ? 'true' : undefined}
                        className={cx(
                          'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                          e.id === actual?.id
                            ? 'border-marca bg-indigo/8'
                            : 'border-borde bg-superficie-3 hover:border-borde-fuerte',
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-texto-3">{e.radicado}</span>
                          <Insignia tono={e.cerrado ? 'neutro' : 'marca'}>{etapa.rotulo}</Insignia>
                          {nulidades > 0 && (
                            <Insignia tono="riesgo">
                              {nulidades} {nulidades === 1 ? 'nulidad' : 'nulidades'}
                            </Insignia>
                          )}
                        </div>
                        <p className="mt-1 font-medium">{e.trabajador}</p>
                        <p className="truncate text-xs text-texto-3">
                          {e.cargo || 'Sin cargo'} · hechos del {fechaLarga(e.fechaHechos)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Tarjeta>

          {actual && (
            <Tarjeta
              titulo={`Carátula · ${actual.radicado}`}
              acciones={
                <Boton variante="fantasma" tamano="sm" onClick={() => eliminar(actual.id)}>
                  <Trash2 size={14} />
                </Boton>
              }
            >
              <div className="space-y-4">
                <Campo etiqueta="Hechos">
                  {(id) => (
                    <AreaTexto
                      id={id}
                      rows={4}
                      value={actual.hechos}
                      onChange={(e) => actualizar(actual.id, { hechos: e.target.value })}
                    />
                  )}
                </Campo>
                <Campo etiqueta="Norma o cláusula infringida">
                  {(id) => (
                    <Entrada
                      id={id}
                      value={actual.normaInfringida}
                      onChange={(e) => actualizar(actual.id, { normaInfringida: e.target.value })}
                    />
                  )}
                </Campo>
                <Campo
                  etiqueta="Sanción propuesta"
                  ayuda="Fijarla antes de la decisión convierte los descargos en un trámite."
                >
                  {(id) => (
                    <select
                      id={id}
                      value={actual.sancion}
                      onChange={(e) => fijarSancion(actual.id, e.target.value as Sancion)}
                      className="w-full cursor-pointer rounded-xl border border-borde bg-superficie px-3 py-2 text-sm"
                    >
                      {SANCIONES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.rotulo}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>

                <Llamado tono="info">
                  {SANCIONES.find((s) => s.id === actual.sancion)!.limite}{' '}
                  <span className="text-texto-3">
                    ({SANCIONES.find((s) => s.id === actual.sancion)!.norma})
                  </span>
                </Llamado>

                <p className="text-xs text-texto-3">
                  Etapa actual: <strong>{etapaPorId(actual.etapa).rotulo}</strong> · {ETAPAS.length}{' '}
                  etapas en el procedimiento completo.
                </p>
              </div>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
