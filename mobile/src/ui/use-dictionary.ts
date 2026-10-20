import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPhraseRepository } from '../composition';
import { Phrase } from '../domain/types';

export type DictionaryStatus = 'loading' | 'ready' | 'error';

/** Milisegundos de espera desde la ultima tecla antes de consultar */
const DEBOUNCE_MS = 250;

/** Lo que el hook entrega a la pantalla */
export interface DictionaryState {
    status: DictionaryStatus;
    phrases: Phrase[];
    errorMessage: string;
    term: string;
    setTerm: (text: string) => void;
}

/**
 * Lista el diccionario y lo filtra en vivo segun lo que se escriba
 */
export function useDictionary(): DictionaryState {
    const [status, setStatus] = useState<DictionaryStatus>('loading');
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    // Lo que se ve en el campo: cambia en cada tecla.
    const [term, setTerm] = useState("");
    // Lo que se consulta: cambia solo cuando se deja de teclear
    const [debouncedTerm, setDebouncedTerm] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(term), DEBOUNCE_MS);

        // Se ejecuta antes del siguiente efecto: cancela el temporizador
        // anterior, de modo que solo sobrevive el de la ultima tecla.
        return () => clearTimeout(timer);
    }, [term]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            async function load() {
                try {
                    const repository = await getPhraseRepository();
                    const found = await repository.search(debouncedTerm);

                    if (cancelled) {
                        return;
                    }
                    setPhrases(found);
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
        }, [debouncedTerm]),
    );

    return { status, phrases, errorMessage, term, setTerm };
}

