import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getPhraseRepository } from "../composition";
import { LanguageCode, Phrase } from "../domain/types";
import {
    addTranslation,
    AddTranslationOutcome,
    AddTranslationRejection,
} from "../usecases/add-translation";

/** Idioma de las traduccioens en la version 1 */
const TARGET_LANG: LanguageCode = "es";

export type PhraseDetailStatus = "loading" | "ready" | "not_found" | "error";

/** En que punto esta el envio del formulario, y que contarle a la persona */
export type AddTranslationFeedback =
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "done"; outcome: AddTranslationOutcome }
    | { kind: "rejected"; reason: AddTranslationRejection }
    | { kind: "error"; message: string };

/** Lo que el hook entrega a la pantalla */
export interface PhraseDetailState {
    status: PhraseDetailStatus;
    phrase: Phrase | null;
    errorMessage: string;
    translationText: string;
    feedback: AddTranslationFeedback;
    setTranslationText: (text: string) => void;
    submit: () => void;
}

/** Carga una frase concreta y permite agregarle traducciones */
export function usePhraseDetail(phraseId: string): PhraseDetailState {
    const [status, setStatus] = useState<PhraseDetailStatus>("loading");
    const [phrase, setPhrase] = useState<Phrase | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [translationText, setTranslationText] = useState("");
    const [feedback, setFeedback] = useState<AddTranslationFeedback>({ kind: "idle" });

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            async function load() {
                try {
                    const repository = await getPhraseRepository();
                    const found = await repository.findById(phraseId);

                    if (cancelled) {
                        return;
                    }

                    if (found === null) {
                        setPhrase(null);
                        setStatus("not_found");
                        return;
                    }

                    setPhrase(found);
                    setStatus("ready");
                } catch (error) {
                    if (cancelled) {
                        return;
                    }
                    setErrorMessage(String(error));
                    setStatus("error");
                }
            }

            load();

            return () => {
                cancelled = true;
            };
        }, [phraseId]),
    );

    async function submit() {
        setFeedback({ kind: "saving" });

        try {
            const repository = await getPhraseRepository();
            const result = await addTranslation(repository, {
                phraseId,
                lang: TARGET_LANG,
                text: translationText,
            });

            if (!result.ok) {
                setFeedback({ kind: "rejected", reason: result.reason });
                return;
            }

            setPhrase(result.phrase);
            setFeedback({ kind: "done", outcome: result.outcome })
            setTranslationText("");
        } catch (error) {
            setFeedback({ kind: "error", message: String(error) });
        }
    }

    return {
        status,
        phrase,
        errorMessage,
        translationText,
        feedback,
        setTranslationText,
        submit,
    };
}