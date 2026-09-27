export type LanguageCode = 'en' | 'es' | 'pt';

export interface Translation {
    id: string;
    phraseId: string;
    lang: LanguageCode;
    text: string;
    createdAt: string;
    updatedAt: string;
}

export interface Phrase {
    id: string;
    lang: LanguageCode;
    text: string;
    createdAt: string;
    updatedAt: string;
    translations: Translation[];
}