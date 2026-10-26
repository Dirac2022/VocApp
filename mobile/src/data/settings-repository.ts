/** Preferencia de tema: seguir al sistema, forzar claro o forzar oscuro. */
export type ThemePreference = "system" | "light" | "dark";

/**Por defecto se respeta lo que la persona ya eligio en su telefono */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

const THEME_PREFERENCES: readonly string[] = ["system", "light", "dark"];

/**
 * El `value is ThemePreference` del retorno es un predicado de tipo: si la
 * funcion devuelve verdadero, TypeScript trata el valor como ThemePreference
 * a partir de ahi, sin necesidad de ninguna asercion.
 */
function isThemePreference(value: unknown): value is ThemePreference {
    return typeof value === "string" && THEME_PREFERENCES.includes(value);
}

/**
 * Convierte lo que haya guardado en la base de datos en una preferencia valida.
 *
 * En la columna hay texto libre y puede contener cualquier cosa: un valor de
 * una version futura de la app, o algo escrito a mano. Ante la duda se devuelve
 * el valor por defecto en lugar de fallar, porque no poder leer una preferencia
 * no debe impedir que la app arranque.
 */
export function parseThemePreference(value: unknown): ThemePreference {
    return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

/**
 * Contrato de acceso a los ajustes de la aplicacion.
 *
 * Esta separado de PhraseRepository a proposito: los ajustes pertenecen al
 * dispositivo y no al diccionario, no viajan en el respaldo, y en la fase 2
 * no se sincronizaran con el servidor.
 */
export interface SettingsRepository {
    /** @returns La preferencia guardada o 'system' si no hay ninguna valida */
    getThemePreference(): Promise<ThemePreference>;

    /** Guarda la preferencia, sustituyendo la anterior si la habia */
    setThemePreference(value: ThemePreference): Promise<void>;
}