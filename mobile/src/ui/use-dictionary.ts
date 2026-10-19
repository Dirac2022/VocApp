import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPhraseRepository } from '../composition';
import { Phrase } from '../domain/types';

export type DictionaryStatus = 'loading' | 'ready' | 'error';

/** Lo que el hook entrega a la pantalla */
export interface DictionaryState {
    status: DictionaryStatus;
    phrases: Phrase[];
    errorMessage: string;
}

/**
 * Carga el diccionario completo una vez, al montarse la pantalla,
 * y expone en qué punto está esa carga
 */
export function useDictionary(): DictionaryState {
    const [status, setStatus] = useState<DictionaryStatus>('loading');
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            async function load() {
                try {
                    const repository = await getPhraseRepository();
                    const all = await repository.listAll();

                    if (cancelled) {
                        return;
                    }
                    setPhrases(all);
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
        }, []),
    );

    return { status, phrases, errorMessage };
}

