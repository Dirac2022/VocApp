import { LanguageCode, Phrase, Translation } from '../domain/types';

/** Datos para crear una frase junto con su primera traducción */
export interface NewPhraseInput {
    lang: LanguageCode;
    text: string;
    translationLang: LanguageCode;
    translationText: string;
}

/** Datos para agregar una traducción a una frase que ya existe */
export interface NewTranslationInput {
    phraseId: string;
    lang: LanguageCode;
    text: string;
}

/**
 * Contrato de acceso a las frases.
 * 
 * Toda implementacion debe comportarse igual ante estos casos:
 * - Las busquedas que no encuentras nada devuelven null o un arreglo vacio, nunca un error
 * - Toda Phrase devuelta incluye sus traducciones
 * - El texto se recibe tal como lo escribio la persona; normalizar es tarea de la implementacion
 * - Insertar algo que ya existe no lanza error: devuelve lo que ya habia
 * - insertTranslation sobre una frase inexistente si lanza error: es un fallo de programacion, no una busqueda
 */
export interface PhraseRepository {
    /** Una frase al azar, opcionalmente de un idioma concreto. null si no hay ninguna. */
    getRandom(lang?: LanguageCode): Promise<Phrase | null>;

    /** La frase con ese identificador, o null si no existe. */
    findById(id: string): Promise<Phrase | null>;

    /** La frase cuyo texto equivale al dado en ese idioma, o null. Sirve para detectar duplicados */
    findByText(lang: LanguageCode, text: string): Promise<Phrase | null>;

    /** Frases cuyo texto, o el de alguna de sus traducciones, contiene el termino */
    search(term: string): Promise<Phrase[]>;

    /** Todas las frases, de la mas reciente a la mas antigua */
    listAll(): Promise<Phrase[]>;

    /** Crea frase y primera traduccion de forma atomica. Si la frase ya existia, agrega la traduccion a la existente */
    insertPhraseWithTranslation(input: NewPhraseInput): Promise<Phrase>;

    /** Agrega una traduccion a una frase existente. Si ya estaba, devuelve la existente */
    insertTranslation(input: NewTranslationInput): Promise<Translation>;

    /** Borra la frase y, en cascada, sus traducciones */
    deletePhrase(id: string): Promise<void>;
}

/** Genera identificadores unicos. Se inyecta para que las pruebas sean predecibles */
export type IdGenerator = () => string;