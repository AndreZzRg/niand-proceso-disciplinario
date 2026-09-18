/**
 * Módulo «Actuaciones y pruebas»: registro de lo que efectivamente ocurrió.
 * Cada registro se encadena por huella con el anterior.
 */
import { useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';

import {
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Insignia,
  Llamado,
  Seleccion,
  Tarjeta,
  Vacio,
} from '../brand/ui';
import { ETAPAS, etapaPorId } from '../domain/proceso';
import type { Etapa } from '../domain/proceso';
import { huellaCorta } from '../lib/huella';
import { fechaLarga } from '../lib/formato';
import { useEstado, useExpediente } from '../store';

export function PanelActuaciones() {
  const { hoy, registrar } = useEstado();
  const e = useExpediente();
  const [borrador, setBorrador] = useState({
    etapa: 'apertura' as Etapa,
    fecha: hoy,
    titulo: '',
    detalle: '',
  });
  const [guardando, setGuardando] = useState(false);

  if (!e) {
    return (
      <Vacio titulo="Seleccione un expediente">
        Las actuaciones pertenecen a un expediente. Elija uno en el módulo{' '}
        <strong>Expedientes</strong>.
      </Vacio>
    );
  }

  const listo = borrador.titulo.trim().length > 3 && borrador.detalle.trim().length > 10;

  const guardar = async () => {
    setGuardando(true);
    try {
      await registrar(e.id, borrador);
      setBorrador({ etapa: borrador.etapa, fecha: hoy, titulo: '', detalle: '' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <Tarjeta
        titulo="Registrar actuación"
        descripcion="Lo que no queda documentado no ocurrió para efectos probatorios."
      >
        <div className="space-y-4">
          <Campo etiqueta="Etapa">
            {(id) => (
              <Seleccion
                id={id}
                value={borrador.etapa}
                onChange={(ev) => setBorrador({ ...borrador, etapa: ev.target.value as Etapa })}
              >
                {ETAPAS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.rotulo}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Fecha de la actuación">
            {(id) => (
              <Entrada
                id={id}
                type="date"
                value={borrador.fecha}
                onChange={(ev) => setBorrador({ ...borrador, fecha: ev.target.value })}
              />
            )}
          </Campo>

          <Campo etiqueta="Título" requerido>
            {(id) => (
              <Entrada
                id={id}
                value={borrador.titulo}
                placeholder="Entrega de la citación a descargos"
                onChange={(ev) => setBorrador({ ...borrador, titulo: ev.target.value })}
              />
            )}
          </Campo>

          <Campo
            etiqueta="Detalle"
            requerido
            ayuda="Qué se hizo, quién estuvo, qué se entregó y qué se recibió."
          >
            {(id) => (
              <AreaTexto
                id={id}
                rows={5}
                value={borrador.detalle}
                onChange={(ev) => setBorrador({ ...borrador, detalle: ev.target.value })}
              />
            )}
          </Campo>

          <Boton disabled={!listo || guardando} onClick={() => void guardar()}>
            <Plus size={15} /> {guardando ? 'Registrando…' : 'Registrar'}
          </Boton>
        </div>

        <Llamado tono="info" className="mt-5" icono={<Paperclip size={18} />}>
          Esta aplicación no almacena archivos. Registre aquí la referencia del soporte —número de
          acta, correo, radicado— y conserve el documento en el expediente físico o digital de la
          empresa.
        </Llamado>
      </Tarjeta>

      <Tarjeta
        titulo={`Actuaciones de ${e.radicado}`}
        descripcion={`${e.actuaciones.length} registradas`}
      >
        {e.actuaciones.length === 0 ? (
          <Vacio titulo="Sin actuaciones">
            El expediente está abierto pero vacío. Registre al menos el informe de los hechos.
          </Vacio>
        ) : (
          <ol className="space-y-3">
            {e.actuaciones.map((a, i) => (
              <li key={a.id} className="rounded-xl border border-borde bg-superficie-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-texto-3">#{i + 1}</span>
                  <Insignia tono="marca">{etapaPorId(a.etapa).rotulo}</Insignia>
                  <span className="text-xs text-texto-3">{fechaLarga(a.fecha)}</span>
                </div>
                <p className="mt-1.5 font-medium">{a.titulo}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-texto-2">{a.detalle}</p>
                <p className="eyebrow mt-2" title={a.huella}>
                  huella {huellaCorta(a.huella)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>
    </div>
  );
}
