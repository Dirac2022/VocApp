import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { normalize } from '../domain/normalize';
import { LanguageCode, Phrase, Translation } from '../domain/types';
import {
    IdGenerator,
    NewPhraseInput,
    NewTranslationInput,
    PhraseRepository,
} from './phrase-repository';

/** Una fila de la tabla phrase, con los nombres de la columna tal cual llegan de SQLite */
interface PhraseRow {
    id: string;
    lang: string;
    text: string;
    text_norm: string;
    created_at: string;
    updated_at: string;
}

/** Una fila de la tabla translation */
interface TranslationRow {
    id: string;
    phrase_id: string;
    lang: string;
    text: string;
    text_norm: string;
    created_at: string;
    updated_at: string;
}

/** Convierte una fila de la base de datos en el objeto de dominio */
function toTranslation(row: TranslationRow): Translation {
    return {
        id: row.id,
        phraseId: row.phrase_id,
        lang: row.lang as LanguageCode,
        text: row.text,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Implementacion del contrato sobre SQLite. Es la unica pieza de toda la
 * app que contiene SQL y que conoce la existencia de las columnas text_norm
 */
export class SQLitePhraseRepository implements PhraseRepository {
    private readonly db: SQLite.SQLiteDatabase;
    private readonly newId: IdGenerator;

    constructor(db: SQLite.SQLiteDatabase, newId: IdGenerator = () => Crypto.randomUUID()) {
        this.db = db;
        this.newId = newId;
    }

    // ------------------------ lecturas ----------------------------------

    async getRandom(lang?: LanguageCode): Promise<Phrase | null> {
        const row =
            lang === undefined
                ? await this.db.getFirstAsync<PhraseRow>(
                    'SELECT * FROM phrase ORDER BY RANDOM() LIMIT 1',
                )
                : await this.db.getFirstAsync<PhraseRow>(
                    'SELECT * FROM phrase WHERE lang = ? ORDER BY RANDOM() LIMIT 1',
                    [lang],
                );

        if (row === null) {
            return null;
        }

        return this.attachOne(row);
    }

    async findById(id: string): Promise<Phrase | null> {
        const row = await this.db.getFirstAsync<PhraseRow>('SELECT * FROM phrase WHERE id = ?', [
            id,
        ]);
        if (row === null) {
            return null;
        }
        return this.attachOne(row);
    }

    async findByText(lang: LanguageCode, text: string): Promise<Phrase | null> {
        const row = await this.db.getFirstAsync<PhraseRow>(
            'SELECT * FROM phrase WHERE lang = ? AND text_norm = ?',
            [lang, normalize(text)],
        );
        if (row === null) {
            return null;
        }

        return this.attachOne(row);
    }

    async search(term: string): Promise<Phrase[]> {
        const wanted = normalize(term);
        if (wanted === '') {
            return this.listAll();
        }

        const pattern = `%${wanted}%`;
        const rows = await this.db.getAllAsync<PhraseRow>(
            `SELECT DISTINCT p.*
             FROM phrase p
             LEFT JOIN translation t ON t.phrase_id = p.id
             WHERE p.text_norm LIKE ? OR t.text_norm LIKE ?
             ORDER BY p.created_at DESC
            `,
            [pattern, pattern],
        );
        return this.attachMany(rows);
    }

    async listAll(): Promise<Phrase[]> {
        const rows = await this.db.getAllAsync<PhraseRow>(
            'SELECT * FROM phrase ORDER BY created_at DESC',
        );
        return this.attachMany(rows);
    }


    // ------------------------------ escrituras ------------------------------

    async insertPhraseWithTranslation(input: NewPhraseInput): Promise<Phrase> {
        const existing = await this.findByText(input.lang, input.text);

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
        const phraseId = this.newId();
        const translationId = this.newId();

        await this.db.withTransactionAsync(async () => {
            await this.db.runAsync(
                `INSERT INTO phrase (id, lang, text, text_norm, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [phraseId, input.lang, input.text.trim(), normalize(input.text), now, now],
            );
            await this.db.runAsync(
                `INSERT INTO translation (id, phrase_id, lang, text, text_norm, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    translationId,
                    phraseId,
                    input.translationLang,
                    input.translationText.trim(),
                    normalize(input.translationText),
                    now,
                    now
                ],
            );
        });

        const created = await this.findById(phraseId);
        if (created === null) {
            throw new Error('La frase no se guardó correctamente');
        }

        return created;
    }

    async insertTranslation(input: NewTranslationInput): Promise<Translation> {
        const phrase = await this.db.getFirstAsync<PhraseRow>(
            'SELECT * FROM phrase WHERE id = ?',
            [input.phraseId]
        );

        if (phrase === null) {
            throw new Error(`No existe la frase ${input.phraseId}`);
        }

        const textNorm = normalize(input.text);
        const already = await this.db.getFirstAsync<TranslationRow>(
            'SELECT * FROM translation WHERE phrase_id = ? AND lang = ? AND text_norm = ?',
            [input.phraseId, input.lang, textNorm]
        );

        if (already !== null) {
            return toTranslation(already);
        }

        const now = new Date().toISOString();
        const id = this.newId();

        await this.db.withTransactionAsync(async () => {
            await this.db.runAsync(
                `INSERT INTO translation (id, phrase_id, lang, text, text_norm, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)   
                `,
                [id, input.phraseId, input.lang, input.text.trim(), textNorm, now, now]
            );

            await this.db.runAsync(
                'UPDATE phrase SET updated_at = ? WHERE id = ?',
                [now, input.phraseId]
            );
        });

        return {
            id,
            phraseId: input.phraseId,
            lang: input.lang,
            text: input.text.trim(),
            createdAt: now,
            updatedAt: now,
        };
    }

    async deletePhrase(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM phrase WHERE id = ?', [id]);
    }

    // ------------------------------ Auxiliares ------------------------------

    /**
     * Completa UNA fila de phrase con sus traducciones.
     * 
     * Delega en attachMany en lugar de tener su propia consulta, para que la
     * lógica de carga viva en un solo sitio y no haya dos versiones que mantener
     * 
     * @param row Fila de la tabla phrase recién leída
     * @returns La frase de dominio con sus traducciones, de la más antigua a la más reciente
     */
    private async attachOne(row: PhraseRow): Promise<Phrase> {
        const [phrase] = await this.attachMany([row]);
        return phrase;
    }

    /**
     * Completa VARIAS filas de phrase con sus traducciones usando una sola consulta.
     * 
     * Evita el problema N+1: cargar traducciones dentro de un bucle lanzaría una
     * consulta por frase, más la inicial. Aquí se piden todas de golpe con una cláusula
     * IN y se reparten en memoria agrupándolas por phrase_id.
     * 
     * El orden de entrada se conserva: el SQL que trajo las filas ya decidió el orden,
     * y aquí solo se recorre ese mismo arreglo.
     * 
     * @param rows Filas de la tabla phrase, en el mismo orden en que deben devolverse
     * @returns Las frases de dominio en ese mismo orden. Arreglo vacío si no se pasa ninguna fila.
     */
    private async attachMany(rows: PhraseRow[]): Promise<Phrase[]> {
        if (rows.length === 0) {
            return [];
        }

        const placeholders = rows.map(() => '?').join(', '); // "?, ?, ?"
        const translationRows = await this.db.getAllAsync<TranslationRow>(
            `SELECT * FROM translation WHERE phrase_id IN (${placeholders}) ORDER BY created_at`,
            rows.map((r) => r.id),
        );

        const byPhrase = new Map<string, Translation[]>();
        for (const tr of translationRows) {
            const list = byPhrase.get(tr.phrase_id) ?? [];
            list.push(toTranslation(tr));
            byPhrase.set(tr.phrase_id, list);
        }

        return rows.map((r) => ({
            id: r.id,
            lang: r.lang as LanguageCode,
            text: r.text,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            translations: byPhrase.get(r.id) ?? [],
        }));

    }
}


