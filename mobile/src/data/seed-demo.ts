import { PhraseRepository } from './phrase-repository';

/** Frases de ejemplo. Archivo temporal: se borra entenro cuando exista RF-02 */
const DEMO: Array<{ en: string; es: string }> = [
    { en: "It's raining cats and dogs", es: "Llueve a cántaros" },
    { en: "to look forward to", es: "tener ganas de" },
    { en: "straightforward", es: "sencillo" },
];

/**
 * Inserta las frases de ejemplo. Es idempotente
 */
export async function seedDemoPhrases(repository: PhraseRepository): Promise<void> {
    for (const item of DEMO) {
        await repository.insertPhraseWithTranslation({
            lang: 'en',
            text: item.en,
            translationLang: 'es',
            translationText: item.es,
        });
    }
}