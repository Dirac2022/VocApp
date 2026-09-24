import { normalize } from '../domain/normalize';
import { LanguageCode, Phrase, Translation } from '../domain/types';
import {
    IdGenerator,
    NewPhraseInput,
    NewTranslationInput,
    PhraseRepository,
} from './phrase-repository';

/** Implementacion del contrato que guarda todo en memoria
 * Se usa en pruebas y para desarrollar sin base de datos.
 */
export class InMemoryPhraseRepository implements PhraseRepository {
    private readonly phrases = new Map<string, Phrase>();
    private readonly newId: IdGenerator;

    constructor(newId: IdGenerator) {
        this.newId = newId;
    }

    async getRandom(lang?: LanguageCode): Promise<Phrase | null> {
        const candidates = [...this.phrases.values()].filter(
            (p) => lang === undefined || p.lang === lang,
        );
        if (candidates.length === 0) {
            return null;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    async findById(id: string): Promise<Phrase | null> {
        return this.phrases.get(id) ?? null;
    }

    async findByText(lang: LanguageCode, text: string): Promise<Phrase | null> {
        const wanted = normalize(text);
        for (const p of this.phrases.values()) {
            if (p.lang === lang && normalize(p.text) === wanted) {
                return p;
            }
        }
        return null;
    }

    async search(term: string): Promise<Phrase[]> {
        const wanted = normalize(term);
        if (wanted === '') {
            return this.listAll();
        }
        return [...this.phrases.values()]
            .filter(
                (p) =>
                    normalize(p.text).includes(wanted) ||
                    p.translations.some((t) => normalize(t.text).includes(wanted)),
            )
            .reverse();
    }

    async listAll(): Promise<Phrase[]> {
        return [...this.phrases.values()].reverse();
    }

    async insertPhraseWithTranslation(input: NewPhraseInput): Promise<Phrase> {
        const existing = await this.findByText(input.lang, input.text)

        if (existing !== null) {
            await this.insertTranslation({
                phraseId: existing.id,
                lang: input.translationLang,
                text: input.translationText,
            });
            const updated = await this.findById(existing.id);
            return updated ?? existing;
        }

        const now = new Date().toISOString();
        const id = this.newId();
        const phrase: Phrase = {
            id,
            lang: input.lang,
            text: input.text.trim(),
            createdAt: now,
            updatedAt: now,
            translations: [
                {
                    id: this.newId(),
                    phraseId: id,
                    lang: input.translationLang,
                    text: input.translationText.trim(),
                    createdAt: now,
                },
            ],
        };
        this.phrases.set(id, phrase);
        return phrase;
    }

    async insertTranslation(input: NewTranslationInput): Promise<Translation> {
        const phrase = this.phrases.get(input.phraseId);
        if (phrase === undefined) {
            throw new Error(`No existe la frase ${input.phraseId}`);
        }

        const wanted = normalize(input.text);
        const already = phrase.translations.find(
            (t) => t.lang === input.lang && normalize(t.text) === wanted,
        );
        if (already !== undefined) {
            return already;
        }

        const translation: Translation = {
            id: this.newId(),
            phraseId: phrase.id,
            lang: input.lang,
            text: input.text.trim(),
            createdAt: new Date().toISOString(),
        };

        this.phrases.set(phrase.id, {
            ...phrase,
            updatedAt: translation.createdAt,
            translations: [...phrase.translations, translation],
        });

        return translation;
    }

    async deletePhrase(id: string): Promise<void> {
        this.phrases.delete(id);
    }
}
