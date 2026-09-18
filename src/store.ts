/**
 * Estado de los expedientes disciplinarios.
 *
 * Persiste solo en el navegador. Las actuaciones se encadenan por huella: una
 * vez registrada, editar su contenido rompe la cadena y la bitácora lo señala.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenZustand } from './lib/almacen';
import { eslabon } from './lib/huella';
import {
  nuevoRadicado,
  type Actuacion,
  type Etapa,
  type Expediente,
  type Sancion,
} from './domain/proceso';

interface Estado {
  expedientes: Expediente[];
  seleccionado: string | null;
  hoy: string;
  crear: (
    datos: Pick<Expediente, 'trabajador' | 'cargo' | 'hechos' | 'normaInfringida' | 'fechaHechos'>,
  ) => void;
  actualizar: (id: string, cambios: Partial<Expediente>) => void;
  eliminar: (id: string) => void;
  seleccionar: (id: string | null) => void;
  avanzar: (id: string, etapa: Etapa) => void;
  fijarSancion: (id: string, sancion: Sancion) => void;
  registrar: (
    id: string,
    datos: { etapa: Etapa; fecha: string; titulo: string; detalle: string },
  ) => Promise<void>;
  setHoy: (f: string) => void;
}

function idAleatorio(): string {
  return crypto.randomUUID();
}

export const useEstado = create<Estado>()(
  persist(
    (set, get) => ({
      expedientes: [],
      seleccionado: null,
      hoy: '2026-09-17',

      crear: (datos) =>
        set((s) => {
          const anio = Number(get().hoy.slice(0, 4));
          const delAnio = s.expedientes.filter((e) => e.radicado.includes(`-${anio}-`)).length;
          const nuevo: Expediente = {
            id: idAleatorio(),
            radicado: nuevoRadicado(anio, delAnio + 1),
            fechaApertura: get().hoy,
            etapa: 'apertura',
            sancion: 'ninguna',
            actuaciones: [],
            cerrado: false,
            ...datos,
          };
          return { expedientes: [nuevo, ...s.expedientes], seleccionado: nuevo.id };
        }),

      actualizar: (id, cambios) =>
        set((s) => ({
          expedientes: s.expedientes.map((e) => (e.id === id ? { ...e, ...cambios } : e)),
        })),

      eliminar: (id) =>
        set((s) => ({
          expedientes: s.expedientes.filter((e) => e.id !== id),
          seleccionado: s.seleccionado === id ? null : s.seleccionado,
        })),

      seleccionar: (seleccionado) => set({ seleccionado }),

      avanzar: (id, etapa) =>
        set((s) => ({
          expedientes: s.expedientes.map((e) =>
            e.id === id
              ? { ...e, etapa, cerrado: etapa === 'ejecutoriado' || etapa === 'archivado' }
              : e,
          ),
        })),

      fijarSancion: (id, sancion) =>
        set((s) => ({
          expedientes: s.expedientes.map((e) => (e.id === id ? { ...e, sancion } : e)),
        })),

      registrar: async (id, datos) => {
        const expediente = get().expedientes.find((e) => e.id === id);
        if (!expediente) return;

        const contenido = `${datos.etapa}|${datos.fecha}|${datos.titulo}|${datos.detalle}`;
        const anterior = expediente.actuaciones.at(-1)?.huella ?? null;
        const huella = await eslabon(contenido, anterior);

        const actuacion: Actuacion = {
          id: idAleatorio(),
          ...datos,
          huella,
          registradaEn: new Date().toISOString(),
        };

        set((s) => ({
          expedientes: s.expedientes.map((e) =>
            e.id === id ? { ...e, actuaciones: [...e.actuaciones, actuacion] } : e,
          ),
        }));
      },

      setHoy: (hoy) => set({ hoy }),
    }),
    {
      name: 'estado',
      version: 1,
      storage: createJSONStorage(() => almacenZustand),
      partialize: (s) => ({
        expedientes: s.expedientes,
        seleccionado: s.seleccionado,
        hoy: s.hoy,
      }),
    },
  ),
);

/** Expediente seleccionado, o `null` si no hay ninguno. */
export function useExpediente(): Expediente | null {
  return useEstado((s) => s.expedientes.find((e) => e.id === s.seleccionado) ?? null);
}
