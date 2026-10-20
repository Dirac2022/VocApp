import { makeRepo } from "../../test-support/repository";

describe('InMemoryPhraseRepository', () => {
    it('devuelve null cuando está vació', async () => {
        const repo = makeRepo();
        expect(await repo.getRandom()).toBeNull();
        expect(await repo.findById('id-1')).toBeNull();
        expect(await repo.listAll()).toEqual([]);
    })

    it('crea una frase con su propia traducción', async () => {
        const repo = makeRepo();
        const phrase = await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            'translationText': 'perro',
        });

        expect(phrase.id).toBe('id-1');
        expect(phrase.translations).toHaveLength(1);
        expect(phrase.translations[0].text).toBe('perro');
        expect(phrase.translations[0].phraseId).toBe('id-1');
    });

    it('encuentra una frase aunque cambien mayúsculas y espacios', async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });

        const found = await repo.findByText('en', ' DOG ');
        expect(found?.text).toBe('dog');
        expect(await repo.findByText('en', 'cat')).toBeNull();
    });

    it('no duplica: insertar una frase existente agrega la traducción a la que habia', async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });
        const second = await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'Dog',
            translationLang: 'es',
            translationText: 'can',
        });

        expect(second.id).toBe('id-1');
        expect(second.translations).toHaveLength(2);
    });

    it('ignora una traducción repetida', async () => {
        const repo = makeRepo();
        const phrase = await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });

        const again = await repo.insertTranslation({
            phraseId: phrase.id,
            lang: 'es',
            text: 'PERRO. ',
        });

        expect(again.id).toBe('id-2');
        const stored = await repo.findById(phrase.id);
        expect(stored?.translations).toHaveLength(1);
    });

    it('lanza error al traducir una frase que no existe', async () => {
        const repo = makeRepo();
        await expect(
            repo.insertTranslation({ phraseId: 'no-existe', lang: 'es', text: ' x ' }),
        ).rejects.toThrow('No existe la frase');
    });

    it('busca por parte de la frase y por parte de la traduccion', async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: 'es',
            text: "It's raining cats and dogs",
            translationLang: 'es',
            translationText: 'Llueve a cántaros',
        });

        expect(await repo.search('cats')).toHaveLength(1);
        expect(await repo.search('cantaros')).toHaveLength(1);
        expect(await repo.search('imposible')).toHaveLength(0);
    });

    it('borra una frase', async () => {
        const repo = makeRepo();
        const phrase = await repo.insertPhraseWithTranslation({
            lang: 'en',
            text: 'dog',
            translationLang: 'es',
            translationText: 'perro',
        });

        await repo.deletePhrase(phrase.id);
        expect(await repo.findById(phrase.id)).toBeNull();
        expect(await repo.listAll()).toEqual([]);
    });

});