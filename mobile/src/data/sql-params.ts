/**
 * Comprueba que el número de marcadores de una consulta coincide con el número
 * de valores que se le pasan.
 *
 * La correspondencia entre los interrogantes de una consulta y su arreglo de
 * valores es posicional, y ningún tipo de TypeScript puede expresarla: el
 * compilador ve una cadena de texto y un arreglo, sin saber que están
 * relacionados. Esta comprobación cubre ese hueco en tiempo de ejecución.
 *
 * Un desajuste es siempre un error de programación, nunca una situación
 * normal, así que corta de inmediato con un mensaje que dice qué falta.
 *
 * Límite conocido: cuenta todos los interrogantes del texto, de modo que uno
 * dentro de una cadena literal contaría de más. Ninguna consulta del proyecto
 * tiene interrogantes literales.
 *
 * @param sql Consulta con marcadores de posición.
 * @param params Valores que se enlazarán, en el mismo orden.
 * @throws Error si las cantidades no coinciden.
 */
export function assertParams(sql: string, params: readonly unknown[]): void {
    const expected = (sql.match(/\?/g) ?? []).length;

    if (expected !== params.length) {
        throw new Error(
            `SQL con ${expected} marcadores y ${params.length} valores: ${sql.trim()}`,
        );
    }
}