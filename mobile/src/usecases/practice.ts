import { PhraseRepository } from "../data/phrase-repository";
import { buildHint, checkAnswer, CheckResult } from "../domain/answer";
import { LanguageCode, Phrase } from '../domain/types';

/**
 * Una ronda de práctica: la frase que toca responder y su pista ya calculada,
 * para que la pantalla no tenga que pedirla aparte
 */
export interface PracticeRound {
    phrase: Phrase;
    hint: string;
}

/**
 * Prepara la siguiente ronda: elige una frase al azar y le calcula la pista.
 * 
 * @param repository Puerto de acceso a las frases. Da igual si detrás hay SQLite,
 *                   memoria o un servidor.
 * @param lang Si se indica, solo frases de ese idioma de origen.
 * @returns La ronda preparada, o null si el diccionario está vacío
 */
export async function nextRound(
    repository: PhraseRepository,
    lang?: LanguageCode,
): Promise<PracticeRound | null> {
    const phrase = await repository.getRandom(lang);

    if (phrase === null) {
        return null;
    }

    return { phrase, hint: buildHint(phrase) };
}

/**
 * Evalúa lo que escribió la persona
 * 
 * @param phrase Frase de la ronda en curso.
 * @param answer Texto tal cual se escribió, sin normalizar
 * @param usedHint Si pidió la pista antes de responder
 * @returns El resultado con su veredicto y la traducción que coincidió, si la hubo
 */
export function evaluateAnswer(phrase: Phrase, answer: string, usedHint: boolean): CheckResult {
    return checkAnswer(phrase, answer, usedHint);
}

/**
 * La persona se rinde y pide ver las traduccioens.
 * No cuenta como acierto, aunque después escriba la respuesta correcta
 */
export function revealAnswer(): CheckResult {
    return { outcome: 'revealed', matched: null };
}