/**
 * Convierte un texto a su forma canonica para comparar y buscar
 * minusculas, sin acentos (conserva la ñ), espacios colapsados,
 * sin signos de puntuacion al inicio ni al final
 */
export function normalize(input: string): string {
    return input
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/n\u0303/g, 'ñ')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/s+/g, ' ')
        .trim()
        .replace(/^[¡¿]+/, '')
        .replace(/[.,;:!?]+$/, '')
        .trim();
}