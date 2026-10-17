import { NewPhraseInput, PhraseRepository } from "../data/phrase-repository";
import { normalize } from "../domain/normalize";
import { Phrase } from "../domain/types";

/** Que ocurrió al agregar */
export type AddPhraseOutcome =
    /** No existia: se creo la frase con su primera traduccion */
    | "created"
    /** La frase ya existia y se le agrego una traduccion nueva */
    | "translation_added"
    /** La frase y esa traduccion ya existian: no se guardo nada */
    | "already_existed";

/** Por que se rechazo la peticion antes de tocar la base de datos */
export type AddPhraseRejection = "empty_phrase" | "empty_translation";

/**
 * Resultado de agregar, en dos formas posibles según la propiedad `ok`.
 * Es una unión discriminada: TypeScript deduce qué campos existen a partir
 * de esa propiedad, de modo que leer `reason` en un resultado correcto no compila.
 */
export type AddPhraseResult =
    | { ok: true, outcome: AddPhraseOutcome; phrase: Phrase }
    | { ok: false, reason: AddPhraseRejection };


/**
 * Agrega una frase con su primera traduccion, o enriquece una que ya existia.
 * 
 * @param repository Puerto de acceso a las frases. Da igual que haya detras
 * @param input Textos e idiomas, tal como los escribio el usuario
 * @returns El desenlace y la frase resultante o el motivo del rechazo
 */
export async function addPhrase(
    repository: PhraseRepository,
    input: NewPhraseInput,
): Promise<AddPhraseResult> {
    if (normalize(input.text) === "") {
        return { ok: false, reason: "empty_phrase" };
    }

    if (normalize(input.translationText) === "") {
        return { ok: false, reason: "empty_translation" };
    }

    const existing = await repository.findByText(input.lang, input.text);
    const translationBefore = existing === null ? 0 : existing.translations.length;

    const phrase = await repository.insertPhraseWithTranslation(input);

    if (existing === null) {
        return { ok: true, outcome: "created", phrase };
    }

    const outcome = phrase.translations.length > translationBefore ? "translation_added" : "already_existed";

    return { ok: true, outcome, phrase };
}