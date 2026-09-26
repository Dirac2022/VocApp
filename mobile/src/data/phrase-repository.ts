import { LanguageCode, Phrase, Translation } from '../domain/types';

/** Datos para crear una frase junto con su primera traducción
 * Una frase nunca se crea sola: el dominio exige que tenga al menos
 * una traducción
*/
export interface NewPhraseInput {
    /** Idioma de origen de la frase */
    lang: LanguageCode;
    /** Texto en el idioma de origen, tal como lo escribió la persona. Sin normalizar */
    text: string;
    /** Idioma de la traducción */
    translationLang: LanguageCode;
    /** Texto de la traducción, tal como lo escribió la persona. Sin normalizar */
    translationText: string;
}

/** Datos para agregar una traducción a una frase que ya existe */
export interface NewTranslationInput {
    /** Clave primaria de la frase a la que pertenecerá. Debe existir */
    phraseId: string;
    /** Idioma de la traducción */
    lang: LanguageCode;
    /** Texto de la traducción, tal como lo escribió la persona. Sin normalizar */
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
    /** 
     * Elige una frase al azar para practicar
     * @param lang Si se indica, solo frases de ese idioma de origen. Si se omite, de cualquiera.
     * @returns La frase elegida con sus traducciones, o null si el diccionario está vacío.
     */
    getRandom(lang?: LanguageCode): Promise<Phrase | null>;

    /**
     * Recupera una frase por su clave primaria
     * @param id Clave primaria de la frase
     * @returns La frase con sus traducciones, o null si no existe
     */
    findById(id: string): Promise<Phrase | null>;

    /**
     * Busca una frase por texto exacto una vez normalizado. Sirve para detectar duplicados
     * antes de crear una frase nueva
     * @param lang Idioma de origen en el que buscar
     * @param text Texto sin normalizar; la implementacion lo normaliza
     * @returns La frase equivalente, o null si no hay ninguna
     */
    findByText(lang: LanguageCode, text: string): Promise<Phrase | null>;

    /**
     * Busqueda por contenido para la pantalla de agregar traducción: basta con
     * recordar un trozo de la frase o de cualquiera de sus traducciones.
     * @param term Texto parcial sin normalizar. Si queda vacío al normalizar, devuelve todo.
     * @returns Las frases coincidentes, de la más reciente a la más antigua. Vacío si no hay ninguna
     */
    search(term: string): Promise<Phrase[]>;

    /**
     * Lista el diccionario completo.
     * @returns  Todas las frases con sus traducciones, de la más reciente a la más antigua
     */
    listAll(): Promise<Phrase[]>;

    /**
     * Crea una frase y su primera traduccion en una sola operación atómica
     * Si ya existia una frase equivalente en ese idioma, no la duplica: le añade la traducción.
     * @param input Textos e idiomas de la frase y de su primera traducción
     * @returns La frase resultante, nueva o ya existente, con todas sus traducciones
     */
    insertPhraseWithTranslation(input: NewPhraseInput): Promise<Phrase>;

    /**
     * Añade una traducción alternativa a una frase existente
     * @param input Clave foránea de la frase, idioma y texto de la traducción
     * @returns La traduccion creada, o la que ya existia si era equivalente
     * @throws Error si la frase indicada no existe
     */
    insertTranslation(input: NewTranslationInput): Promise<Translation>;

    /**
     * Borra una frase y, en cascada, todas sus traducciones
     * @param id Clave primaria de la frase. Si no existe, no hace nada ni lanza error.
     */
    deletePhrase(id: string): Promise<void>;
}

/**
 * Genera identificadores únicos. Se inyecta en cada implementación en lugar de
 * llamar directamente a una librería, para que las pruebas usen un contador
 * predecible y el código del repositorio no dependa de Expo
 */
export type IdGenerator = () => string;