/**
 * Módulo «Bitácora de evidencia»: verificación de la cadena de huellas y
 * exportación del expediente completo.
 */
import { useEffect, useState } from 'react';
import { Download, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Boton, Dato, Llamado, Tabla, Tarjeta, Td, Th, Vacio } from '../brand/ui';
import { etapaPorId } from '../domain/proceso';
import { exportarCSV, exportarJSON } from '../lib/exportar';
import { huellaCorta, verificarCadena } from '../lib/huella';
import { fechaLarga } from '../lib/formato';
import { useEstado, useExpediente } from '../store';

export function PanelBitacora() {
  const { expedientes } = useEstado();
  const e = useExpediente();

  // La verificación es asíncrona (WebCrypto). Se guarda junto a la clave del
  // expediente verificado: así el resultado de un expediente nunca se muestra
  // sobre otro, y no hace falta escribir estado de forma síncrona en el efecto.
  const [verificacion, setVerificacion] = useState<{
    clave: string;
    resultado: { intacta: boolean; primerFallo: number | null };
  } | null>(null);

  const clave = e ? `${e.id}:${e.actuaciones.map((a) => a.huella).join('|')}` : '';

  useEffect(() => {
    if (!e) return;
    let vigente = true;
    const registros = e.actuaciones.map((a) => ({
      contenido: `${a.etapa}|${a.fecha}|${a.titulo}|${a.detalle}`,
      huella: a.huella,
    }));
    void verificarCadena(registros).then((resultado) => {
      if (vigente) setVerificacion({ clave, resultado });
    });
    return () => {
      vigente = false;
    };
  }, [e, clave]);

  const estado = verificacion?.clave === clave ? verificacion.resultado : null;

  if (!e) {
    return (
      <Vacio titulo="Seleccione un expediente">
        La bitácora verifica la integridad de las actuaciones de un expediente.
      </Vacio>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Actuaciones" valor={e.actuaciones.length} />
        <Dato
          rotulo="Integridad de la cadena"
          valor={estado === null ? 'Verificando…' : estado.intacta ? 'Intacta' : 'Rota'}
          tono={estado === null ? 'neutro' : estado.intacta ? 'ok' : 'riesgo'}
        />
        <Dato rotulo="Etapa" valor={etapaPorId(e.etapa).rotulo} tono="marca" />
      </div>

      {estado && !estado.intacta && (
        <Llamado
          tono="riesgo"
          titulo="La cadena de huellas está rota"
          icono={<ShieldAlert size={18} />}
        >
          La actuación número {(estado.primerFallo ?? 0) + 1} no coincide con su huella. Eso
          significa que su contenido cambió después de registrarse, o que el almacenamiento del
          navegador fue editado por fuera de la aplicación. Un expediente con la cadena rota no
          sirve como evidencia de trazabilidad.
        </Llamado>
      )}

      {estado?.intacta && e.actuaciones.length > 0 && (
        <Llamado tono="ok" titulo="Cadena verificada" icono={<ShieldCheck size={18} />}>
          Cada actuación incorpora la huella de la anterior. Alterar cualquier eslabón invalidaría
          todos los siguientes, y la verificación lo detectaría. Esto acredita{' '}
          <strong>integridad</strong>, no autoría: quién escribió cada registro es cuestión de
          firma, no de huella.
        </Llamado>
      )}

      <Tarjeta
        titulo="Bitácora"
        descripcion={`${e.radicado} · ${e.trabajador}`}
        acciones={
          <>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() =>
                exportarCSV(
                  [
                    ['Bitácora del expediente', e.radicado],
                    ['Trabajador', e.trabajador, 'Cargo', e.cargo],
                    ['Hechos', e.hechos],
                    [],
                    ['#', 'Etapa', 'Fecha', 'Título', 'Detalle', 'Huella', 'Registrada en'],
                    ...e.actuaciones.map((a, i) => [
                      i + 1,
                      etapaPorId(a.etapa).rotulo,
                      a.fecha,
                      a.titulo,
                      a.detalle,
                      a.huella,
                      a.registradaEn,
                    ]),
                  ],
                  `bitacora-${e.radicado}`,
                )
              }
            >
              <Download size={14} /> CSV
            </Boton>
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => exportarJSON({ expedientes }, 'expedientes')}
            >
              JSON completo
            </Boton>
          </>
        }
      >
        {e.actuaciones.length === 0 ? (
          <Vacio titulo="Bitácora vacía">
            Registre actuaciones en el módulo correspondiente y aquí aparecerá la cadena.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Etapa</Th>
                <Th>Actuación</Th>
                <Th>Huella</Th>
              </tr>
            </thead>
            <tbody>
              {e.actuaciones.map((a, i) => (
                <tr
                  key={a.id}
                  className={
                    estado && !estado.intacta && estado.primerFallo === i
                      ? 'bg-alerta/8'
                      : undefined
                  }
                >
                  <Td numerico className="font-mono text-texto-3">
                    {i + 1}
                  </Td>
                  <Td>{etapaPorId(a.etapa).rotulo}</Td>
                  <Td>
                    <span className="font-medium">{a.titulo}</span>
                    <span className="block text-xs text-texto-3">{fechaLarga(a.fecha)}</span>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs text-texto-3" title={a.huella}>
                      {huellaCorta(a.huella)}
                    </code>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
