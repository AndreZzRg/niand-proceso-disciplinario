import { describe, expect, it } from 'vitest';

import { eslabon, huellaCorta, sha256, verificarCadena } from './huella';

describe('huella SHA-256', () => {
  it('reproduce el vector de prueba conocido de la cadena vacía', async () => {
    expect(await sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('es determinista', async () => {
    expect(await sha256('acta de descargos')).toBe(await sha256('acta de descargos'));
  });

  it('cambia por completo ante una modificación mínima', async () => {
    const a = await sha256('El trabajador aceptó los hechos.');
    const b = await sha256('El trabajador aceptó los hechos');
    expect(a).not.toBe(b);
  });

  it('abrevia sin perder los extremos', () => {
    const h = 'a'.repeat(64);
    expect(huellaCorta(h)).toBe('aaaaaaaa…aaaaaaaa');
    expect(huellaCorta('corta')).toBe('corta');
  });
});

describe('cadena de eslabones', () => {
  const contenidos = ['apertura', 'citación', 'descargos', 'decisión'];

  async function cadena(textos: string[]) {
    const out: { contenido: string; huella: string }[] = [];
    let anterior: string | null = null;
    for (const c of textos) {
      const huella = await eslabon(c, anterior);
      out.push({ contenido: c, huella });
      anterior = huella;
    }
    return out;
  }

  it('valida una cadena intacta', async () => {
    expect(await verificarCadena(await cadena(contenidos))).toEqual({
      intacta: true,
      primerFallo: null,
    });
  });

  it('detecta la alteración de un registro intermedio', async () => {
    const c = await cadena(contenidos);
    const alterada = c.map((r, i) => (i === 1 ? { ...r, contenido: 'citación adulterada' } : r));
    expect(await verificarCadena(alterada)).toEqual({ intacta: false, primerFallo: 1 });
  });

  it('detecta la alteración del último registro', async () => {
    const c = await cadena(contenidos);
    const alterada = [...c.slice(0, -1), { ...c.at(-1)!, contenido: 'otra decisión' }];
    expect((await verificarCadena(alterada)).primerFallo).toBe(3);
  });

  it('detecta un registro insertado en medio', async () => {
    const c = await cadena(contenidos);
    const inyectada = [...c.slice(0, 2), { contenido: 'falso', huella: 'x' }, ...c.slice(2)];
    expect((await verificarCadena(inyectada)).intacta).toBe(false);
  });

  it('acepta una cadena vacía', async () => {
    expect(await verificarCadena([])).toEqual({ intacta: true, primerFallo: null });
  });

  it('produce huellas distintas para el mismo contenido en posiciones distintas', async () => {
    const primera = await eslabon('acta', null);
    const segunda = await eslabon('acta', primera);
    expect(primera).not.toBe(segunda);
  });
});
