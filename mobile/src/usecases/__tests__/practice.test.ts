import { evaluateAnswer, nextRound, revealAnswer } from '../practice';
import { makeRepo } from '../../test-support/repository';

describe('nextRound', () => {
    it('devuelve null cuando el diccionario esta vacío', async () => {
        const repo = makeRepo();
        expect(await nextRound(repo)).toBeNull();
    });

    it('devuelve la frase con su pista ya calculada', async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });

        const round = await nextRound(repo);

        expect(round?.phrase.text).toBe('dog');
        expect(round?.hint).toBe('p _ _ _ _');
    });

    it('respeta el idioma de origen pedido', async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });

        expect(await nextRound(repo, 'en')).not.toBeNull();
        expect(await nextRound(repo, 'pt')).toBeNull();
    });
});

describe('evaluateAnswer', () => {
    async function phraseWithTranslations() {
        const repo = makeRepo();
        const phrase = await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: "It's raining cats and dogs",
            translationLang: 'es',
            translationText: 'Llueve a cántaros',
        });
        await repo.insertTranslation({
            phraseId: phrase.id,
            lang: 'es',
            text: 'Esta lloviendo muchísimo',
        });
        const updated = await repo.findById(phrase.id);
        return updated ?? phrase;
    }

    it('acepta una respuesta equivalente aunque cambien mayusculas y acentos', async () => {
        const phrase = await phraseWithTranslations();
        const result = evaluateAnswer(phrase, 'LLUEVE A CANTAROS.', false);

        expect(result.outcome).toBe('correct');
        expect(result.matched?.text).toBe('Llueve a cántaros');
    });

    it('acepta cualquiera de las traducciones registradas', async () => {
        const phrase = await phraseWithTranslations();
        expect(evaluateAnswer(phrase, 'esta lloviendo muchisimo', false).outcome).toBe('correct');
    });

    it('marca correct_with_hint cuando se uso la pista', async () => {
        const phrase = await phraseWithTranslations();
        expect(evaluateAnswer(phrase, 'llueve a cantaros', true).outcome).toBe('correct_with_hint');
    });

    it('rechaza una respuesta que no coincide', async () => {
        const phrase = await phraseWithTranslations();
        const result = evaluateAnswer(phrase, 'llueve mucho', false);

        expect(result.outcome).toBe('incorrect');
        expect(result.matched).toBeNull();
    });
});

describe('revealAnswer', () => {
    it('marca la ronda como revelada y sin coincidencia', () => {
        const result = revealAnswer();
        expect(result.outcome).toBe('revealed');
        expect(result.matched).toBeNull();
    })
})