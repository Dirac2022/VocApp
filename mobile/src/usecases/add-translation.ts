import { NewTranslationInput, PhraseRepository } from "../data/phrase-repository";
import { normalize } from "../domain/normalize";
import { Phrase } from "../domain/types";

/** Que ocurrio al agregar la traduccion */
export type AddTranslationOutcome =
    /** No estaba: se guardo */
    | "added"
    /** Esa misma traduccion ya existia para la frase: no se guardo nada */
    | "already_existed";

/** Por que se rechazo la peticion */
export type AddTranslationRejection = "empty_translation" | "phrase_not_found"

/** Resultado en dos formas posibles segun la propiedad 'ok' */
export type AddTranslationResult =
    | { ok: true; outcome: AddTranslationOutcome; phrase: Phrase }
    | { ok: false; reason: AddTranslationRejection };

/**
 * Agraga una traduccion alternativa a una frase que ya existia
 * 
 * @param repository Puerto de acceso a las frases
 * @param input Identificador de la frase, idioma y texto tal como se escribio
 * @returns El desenlace y la frase con todas sus traducciones, o el motivo del rechazo
 */
export async function addTranslation(
    repository: PhraseRepository,
    input: NewTranslationInput,
): Promise<AddTranslationResult> {
    if (normalize(input.text) === "") {
        return { ok: false, reason: "empty_translation" };
    }

    const existing = await repository.findById(input.phraseId);

    if (existing === null) {
        return { ok: false, reason: "phrase_not_found" };
    }

    await repository.insertTranslation(input);

    const phrase = (await repository.findById(input.phraseId)) ?? existing;

    const outcome = phrase.translations.length > existing.translations.length ? "added" : "already_existed"

    return { ok: true, outcome, phrase };
}