/**
 * Huella criptográfica del contenido de una actuación.
 *
 * Sirve para detectar alteración posterior: si alguien edita el texto de un
 * acta ya registrada, la huella deja de coincidir. No sustituye una firma
 * —no acredita quién lo escribió—, pero sí prueba integridad, que es el
 * primero de los criterios del art. 8 de la Ley 527 de 1999.
 */

/** SHA-256 en hexadecimal, calculado con la WebCrypto del navegador. */
export async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Forma corta para mostrar en pantalla sin ocupar una línea entera. */
export function huellaCorta(hex: string): string {
  return hex.length <= 16 ? hex : `${hex.slice(0, 8)}…${hex.slice(-8)}`;
}

/**
 * Encadena una actuación con la anterior. Cada huella incorpora la previa, de
 * modo que alterar un eslabón invalida todos los siguientes: es lo que
 * convierte una lista de registros en una bitácora defendible.
 */
export async function eslabon(contenido: string, huellaAnterior: string | null): Promise<string> {
  return sha256(`${huellaAnterior ?? 'GENESIS'}\n${contenido}`);
}

/** Verifica una cadena completa de eslabones. */
export async function verificarCadena(
  registros: ReadonlyArray<{ contenido: string; huella: string }>,
): Promise<{ intacta: boolean; primerFallo: number | null }> {
  let anterior: string | null = null;
  for (const [i, r] of registros.entries()) {
    const esperada = await eslabon(r.contenido, anterior);
    if (esperada !== r.huella) return { intacta: false, primerFallo: i };
    anterior = r.huella;
  }
  return { intacta: true, primerFallo: null };
}
