/**
 * Lista de migraciones del esquema. La posicion determina el numero de version:
 * el primer elemento lleva la base de datos a la version 1, el segundo a la 2, etc.
 * 
 * Regla que no se rompe nunca: una migracion ya ejecutada en un telefono real
 * NO se edita. Para cambiar algo, se añade una migracion nueva al final.
 * Editar una antigua dejaría bases de datos distintas según cuándo se instaló la app.
 */
export const MIGRATIONS: string[] = [
    // Version 1
    `
    CREATE TABLE phrase (
        id          TEXT PRIMARY KEY NOT NULL,
        lang        TEXT NOT NULL CHECK (length(lang) = 2),
        text        TEXT NOT NULL CHECK (length(trim(text)) > 0),
        text_norm   TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    );

    CREATE TABLE translation (
        id          TEXT PRIMARY KEY NOT NULL,
        phrase_id   TEXT NOT NULL REFERENCES phrase(id) ON DELETE CASCADE,
        lang        TEXT NOT NULL CHECK (length(lang) = 2),
        text        TEXT NOT NULL CHECK (length(trim(text)) > 0),
        text_norm   TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    );

    CREATE TABLE app_setting (
        key         TEXT PRIMARY KEY NOT NULL,
        value       TEXT NOT NULL,
        updated_at  TEXT NOT NULL
    );

    CREATE UNIQUE INDEX uq_phrase_lang_text_norm
        ON phrase (lang, text_norm);

    CREATE UNIQUE INDEX uq_translation_phrase_lang_text_norm
        ON translation (phrase_id, lang, text_norm);
    `,
]