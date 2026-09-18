import { useState, type JSX } from 'react';

import { Shell, type ModuloId } from './brand/Shell';
import { PanelActos } from './features/PanelActos';
import { PanelActuaciones } from './features/PanelActuaciones';
import { PanelBitacora } from './features/PanelBitacora';
import { PanelExpedientes } from './features/PanelExpedientes';
import { PanelLinea } from './features/PanelLinea';

const PANELES: Record<ModuloId, () => JSX.Element> = {
  expedientes: PanelExpedientes,
  'linea-de-tiempo-y-terminos': PanelLinea,
  'actuaciones-y-pruebas': PanelActuaciones,
  'generador-de-actos': PanelActos,
  'bitacora-de-evidencia': PanelBitacora,
};

export default function App() {
  const [modulo, setModulo] = useState<ModuloId>('expedientes');
  const Panel = PANELES[modulo];

  return (
    <Shell moduloActivo={modulo} onModulo={setModulo}>
      <Panel />
    </Shell>
  );
}
