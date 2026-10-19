import { useState } from "react";
import { getPhraseRepository } from "../composition";
import { LanguageCode } from "../domain/types";
import { addPhrase, AddPhraseOutcome, AddPhraseRejection } from "../usecases/add-phrase";

/**
 * Par de idiomas de la versión 1. Viven aquí, con nombre, en lugar de
 * esparcidos como literales por el código: cuando llegue RF-13, el par
 * portugués a español, este es el único sitio del formulario que cambia.
 */
const SOURCE_LANG: LanguageCode = "en";
const TARGET_LANG: LanguageCode = "es";

/** En que punto esta el envio, y que hay que contarle a la persona */
export type AddPhraseFeedback =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "done"; outcome: AddPhraseOutcome }
    | { kind: "rejected"; reason: AddPhraseRejection }
    | { kind: "error"; message: string };

/** Lo que el hook entrega a la pantalla */
export interface AddPhraseFormState {
    phraseText: string;
    translationText: string;
    feedback: AddPhraseFeedback;
    setPhraseText: (text: string) => void;
    setTranslationText: (text: string) => void;
    submit: () => void;
}

/** Gobierna el formulario de agregar frase */
export function useAddPhraseForm(): AddPhraseFormState {
    const [phraseText, setPhraseText] = useState("");
    const [translationText, setTranslationText] = useState("");
    const [feedback, setFeedback] = useState<AddPhraseFeedback>({ kind: "idle" });

    async function submit() {
        setFeedback({ kind: "saving" });

        try {
            const repository = await getPhraseRepository();
            const result = await addPhrase(repository, {
                lang: SOURCE_LANG,
                text: phraseText,
                translationLang: TARGET_LANG,
                translationText,
            });

            if (!result.ok) {
                setFeedback({ kind: "rejected", reason: result.reason });
                return;
            }

            setFeedback({ kind: "done", outcome: result.outcome });
            setPhraseText("");
            setTranslationText("");
        } catch (error) {
            setFeedback({ kind: "error", message: String(error) });
        }
    }

    return {
        phraseText,
        translationText,
        feedback,
        setPhraseText,
        setTranslationText,
        submit
    };
}