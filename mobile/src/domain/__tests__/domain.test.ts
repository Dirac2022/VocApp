import { normalize } from '../normalize';
import { buildHint, checkAnswer } from '../answer';
import { Phrase } from '../types';

/**Fabrica una frase de prueba con las traducciones indicadas */
function makePhrase(...translations: string[]): Phrase {
    const now = '2026-09-22T00:00:00.000Z';
    return {
        id: 'p1',
        lang: 'en',
        text: 'demo',
        createdAt: now,
        updatedAt: now,
        translations: translations.map((text, i) => ({
            id: `t${i}`,
            phraseId: 'p1',
            lang: 'es',
            text,
            createdAt: now
        }))
    }
}

describe('normalize', () => {
    it('quita mayusculas, acentos, espacios repetidos y puntuacion de los extremos', () => {
        expect(normalize('   ¡El Perro Marrón!   ')).toBe('el perro marron');
    });

    it('conserva la ñ', () => {
        expect(normalize('Año nuevo.')).toBe('año nuevo');
    });

    it('devuelve cadena vacía si solo hay espacios', () => {
        expect(normalize('  ')).toBe('');
    });

    it('no toca la puntuación interna', () => {
        expect(normalize("It's ok")).toBe("it's ok");
    });
});

describe('checkAnswer', () => {
    const phrase = makePhrase('Llueve a cántaros', 'Está lloviendo muchisimo');

    it('acepta una respuesta equivalente aunque cambien a mayúsculas y acentos', () => {
        const result = checkAnswer(phrase, 'LLUEVE A CANTAROS.', false);
        expect(result.outcome).toBe('correct');
        expect(result.matched?.text).toBe('Llueve a cántaros');
    });

    it('marca correct_with_hint cuando se usó pista', () => {
        expect(checkAnswer(phrase, 'llueve a cantaros', true).outcome).toBe('correct_with_hint');
    });

    it('rechaza una respuesta que no coincide con ninguna traducción', () => {
        const result = checkAnswer(phrase, 'llueve mucho', false);
        expect(result.outcome).toBe('incorrect');
        expect(result.matched).toBeNull();
    });

    it('rechaza la respuesta vacía', () => {
        expect(checkAnswer(phrase, '  ', false).outcome).toBe('incorrect');
    });
});

describe('buildHint', () => {
    it('muestra la primera letra y un guion por cada letra restante', () => {
        expect(buildHint(makePhrase('perro'))).toBe('p _ _ _ _');
    });

    it('elige la traducción más corta', () => {
        expect(buildHint(makePhrase('Está lloviendo muchísimo', 'Diluvia'))).toBe('D _ _ _ _ _ _');
    });

    it('devuelve cadena vacía si no hay traducciones', () => {
        expect(buildHint(makePhrase())).toBe('');
    });
})