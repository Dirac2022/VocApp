import { PhraseRepository } from "../data/phrase-repository";
import { LanguageCode, Phrase } from "../domain/types";

/**
 * Version del formato del archivo. Sube cuando la forma del archivo cambie
 * de modo imcompatible, para que el importador sepa que esta leyendo
 */
export const BACKUP_SCHEMA_VERSION = 1;

/** Idiomas que esta version reconoce */
const KNOWN_LANGS: readonly LanguageCode[] = ["en", "es", "pt"];

/** Por que se rechazo el archivo */
export type ParseBackupRejection =
    | "invalid_json"
    | "not_an_object"
    | "unsupported_version"
    | "invalid_shape";

/** Resultado de leer un archivo, en dos formas segun 'ok' */
export type ParseBackupResult =
    | { ok: true, backup: BackupFile }
    | { ok: false, reason: ParseBackupRejection };

/** Una traduccion tal como viaja en el archivo */
export interface BackupTranslation {
    id: string;
    lang: LanguageCode;
    text: string;
    createdAt: string;
    updatedAt: string;
}

/** Una frase tal como viaja en el archivo, con sus traducciones dentro */
export interface BackupPhrase {
    id: string;
    lang: LanguageCode;
    text: string;
    createdAt: string;
    updatedAt: string;
    translations: BackupTranslation[];
}

/** El archivo completo */
export interface BackupFile {
    schemaVersion: number;
    exportedAt: string;
    phrases: BackupPhrase[];
}

/** Convierte una frase del dominio a su forma de archivo */
function toBackupPhrase(phrase: Phrase): BackupPhrase {
    return {
        id: phrase.id,
        lang: phrase.lang,
        text: phrase.text,
        createdAt: phrase.createdAt,
        updatedAt: phrase.updatedAt,
        translations: phrase.translations.map((translation) => ({
            id: translation.id,
            lang: translation.lang,
            text: translation.text,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        })),
    };
}

/** Compureba que el valir sea texto con algo adentro */
function isFilledString(value: unknown): value is string {
    return typeof value === "string" && value.trim() !== "";
}

/**
 * Comprueba que el valor sea uno de los códigos de idioma conocidos.
 * El `value is LanguageCode` del retorno es un predicado de tipo: si la
 * función devuelve verdadero, TypeScript trata el valor como LanguageCode
 * a partir de ahí, sin necesidad de ninguna aserción.
 */
function isLanguageCode(value: unknown): value is LanguageCode {
    return typeof value === "string" && KNOWN_LANGS.includes(value as LanguageCode);
}

/** Valida una traduccion del archivo. Devuelve null si no cumple */
function readTranslation(value: unknown): BackupTranslation | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }

    const row = value as Record<string, unknown>;

    if (!isFilledString(row.id) || !isFilledString(row.text) || !isLanguageCode(row.lang)) {
        return null;
    }

    return {
        id: row.id,
        lang: row.lang,
        text: row.text,
        createdAt: isFilledString(row.createdAt) ? row.createdAt : "",
        updatedAt: isFilledString(row.updatedAt) ? row.updatedAt : "",
    };
}

/** Valida una frase del archivo con sus traducciones. Devuelve null si no cumple */
function readPhrase(value: unknown): BackupPhrase | null {
    if (typeof value !== "object" || value === null) {
        return null;
    }

    const row = value as Record<string, unknown>;

    if (!isFilledString(row.id) || !isFilledString(row.text) || !isLanguageCode(row.lang)) {
        return null;
    }

    if (!Array.isArray(row.translations)) {
        return null;
    }

    const translations: BackupTranslation[] = []
    for (const item of row.translations) {
        const translation = readTranslation(item);
        if (translation === null) {
            return null;
        }
        translations.push(translation);
    }

    return {
        id: row.id,
        lang: row.lang,
        text: row.text,
        createdAt: isFilledString(row.createdAt) ? row.createdAt : "",
        updatedAt: isFilledString(row.updatedAt) ? row.updatedAt : "",
        translations,
    };
}

/**
 * Arma el respaldo completo del diccionario.
 *
 * @param repository Puerto de acceso a las frases.
 * @param now Momento de la exportación. Se inyecta para que las pruebas
 *            no dependan del reloj; en la app se usa el valor por defecto.
 * @returns El archivo listo para convertir a texto con JSON.stringify.
 */
export async function buildBackup(
    repository: PhraseRepository,
    now: string = new Date().toISOString(),
): Promise<BackupFile> {
    const phrases = await repository.listAll();

    return {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        exportedAt: now,
        phrases: phrases.map(toBackupPhrase),
    };
}

/**
 * Lee el texto de un archivo de respaldo y comprueba su forma
 * 
 * @param raw Contenido del archivo, tal cual se leyo del disco
 * @returns El respaldo validado, o el motivo por el que no sirve
 */
export function parseBackup(raw: string): ParseBackupResult {
    let data: unknown;

    try {
        data = JSON.parse(raw);
    } catch {
        return { ok: false, reason: "invalid_json" };
    }

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return { ok: false, reason: "not_an_object" };
    }

    const candidate = data as Record<string, unknown>;

    if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
        return { ok: false, reason: "unsupported_version" };
    }


    if (!Array.isArray(candidate.phrases)) {
        return { ok: false, reason: "invalid_shape" };
    }

    const phrases: BackupPhrase[] = [];
    for (const item of candidate.phrases) {
        const phrase = readPhrase(item);
        if (phrase === null) {
            return { ok: false, reason: "invalid_shape" };
        }
        phrases.push(phrase);
    }

    return {
        ok: true,
        backup: {
            schemaVersion: BACKUP_SCHEMA_VERSION,
            exportedAt: isFilledString(candidate.exportedAt) ? candidate.exportedAt : "",
            phrases,
        },
    };
}