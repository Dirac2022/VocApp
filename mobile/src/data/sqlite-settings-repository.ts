import * as SQLite from "expo-sqlite";
import {
    DEFAULT_THEME_PREFERENCE,
    parseThemePreference,
    SettingsRepository,
    ThemePreference,
} from "./settings-repository";
import { assertParams } from "./sql-params";

/** Clave con la que se guarda el tema en la tabla app_setting */
const THEME_KEY = "theme";

/** Una fila de app_setting, con los nombres de columna tal cual llegan */
interface SettingRow {
    key: string;
    value: string;
    updated_at: string;
}

/** Ajustes guardados en SQLite */
export class SQLiteSettingsRepository implements SettingsRepository {
    private readonly db: SQLite.SQLiteDatabase;

    constructor(db: SQLite.SQLiteDatabase) {
        this.db = db;
    }

    async getThemePreference(): Promise<ThemePreference> {
        const sql = "SELECT * FROM app_setting WHERE key = ?";
        const params = [THEME_KEY];
        assertParams(sql, params);

        const row = await this.db.getFirstAsync<SettingRow>(sql, params);

        if (row === null) {
            return DEFAULT_THEME_PREFERENCE;
        }

        return parseThemePreference(row.value);
    }

    async setThemePreference(value: ThemePreference): Promise<void> {
        const sql = `INSERT INTO app_setting (key, value, updated_at)
                     VALUES (?, ?, ?)
                     ON CONFLICT(key) DO UPDATE SET
                        value = excluded.value,
                        updated_at = excluded.updated_at`;
        const params = [THEME_KEY, value, new Date().toISOString()];
        assertParams(sql, params);

        await this.db.runAsync(sql, params);
    }
}