import { Phrase, Translation } from './types';
import { normalize } from './normalize';

/** Resultado de un intento. */
export type AttemptOutcome = 'correct' | 'incorrect' | 'correct_with_hint' | 'revealed';

export interface CheckResult {
    outcome: AttemptOutcome;
    /** La traduccion que coincidio, o null si ninguna */
    matched: Translation | null;
}

/**
 * Compara la respuesta del usuario con las traducciones de la frase.
 * La comparacion es sobre texto normalizado
 */
export function checkAnswer(phrase: Phrase, answer: string, usedHint: boolean): CheckResult {
    const wanted = normalize(answer);

    if (wanted === '') {
        return { outcome: 'incorrect', matched: null };
    }

    const matched = phrase.translations.find((t) => normalize(t.text) === wanted);

    if (matched === undefined) {
        return { outcome: 'incorrect', matched: null };
    }

    return { outcome: usedHint ? 'correct_with_hint' : 'correct', matched };
}

/**
 * Pista a partir de la traduccion mas corta: primera letra de cada palabra
 * y un guion bajo por cada letra restante. "perro" -> "p _ _ _ _"
 */
export function buildHint(phrase: Phrase): string {
    if (phrase.translations.length === 0) {
        return ''
    }

    let shortest = phrase.translations[0];
    for (const t of phrase.translations) {
        if (t.text.length < shortest.text.length) {
            shortest = t;
        }
    }

    return shortest.text
        .trim()
        .split(/\s+/)
        .map((word) => word[0] + ' _'.repeat(word.length - 1))
        .join(' ');
}