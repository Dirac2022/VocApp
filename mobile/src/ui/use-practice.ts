import { useEffect, useState } from 'react';
import { getPhraseRepository } from '../composition';
import { CheckResult } from '../domain/answer';
import { evaluateAnswer, nextRound, PracticeRound, revealAnswer } from '../usecases/practice';

export type PracticeStatus = 'loading' | 'ready' | 'empty' | 'error';

/** Todo lo que la pantalla necesita para dibujar y para reaccionar */
export interface PracticeState {
    status: PracticeStatus;
    round: PracticeRound | null;
    answer: string;
    hintVisible: boolean;
    result: CheckResult | null;
    errorMessage: string;
    setAnswer: (text: string) => void;
    showHint: () => void;
    check: () => void;
    reveal: () => void;
    next: () => void;
}

/**Gobierna una sesion de practica: carga rondas y evalua respuestas */
export function usePractice(): PracticeState {
    const [status, setStatus] = useState<PracticeStatus>('loading');
    const [round, setRound] = useState<PracticeRound | null>(null);
    const [answer, setAnswer] = useState('');
    const [hintVisible, setHintVisible] = useState(false);
    const [result, setResult] = useState<CheckResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Contador de rondas. Cambiarlo es lo que dispara la carga de uan frase nueva.
    const [roundNumber, setRoundNumber] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setStatus('loading');

            try {
                const repository = await getPhraseRepository();
                const prepared = await nextRound(repository, 'en');

                if (cancelled) {
                    return;
                }

                if (prepared === null) {
                    setRound(null);
                    setStatus('empty');
                    return;
                }

                setRound(prepared);
                setStatus('ready');
            } catch (error) {
                if (cancelled) {
                    return;
                }
                setErrorMessage(String(error));
                setStatus('error');
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [roundNumber]);

    function showHint() {
        setHintVisible(true);
    }

    function check() {
        if (round === null) {
            return;
        }
        setResult(evaluateAnswer(round.phrase, answer, hintVisible));
    }

    function reveal() {
        setResult(revealAnswer());
    }

    function next() {
        setAnswer('');
        setHintVisible(false);
        setResult(null);
        setRoundNumber((n) => n + 1);
    }

    return {
        status,
        round,
        answer,
        hintVisible,
        result,
        errorMessage,
        setAnswer,
        showHint,
        check,
        reveal,
        next,
    };
}