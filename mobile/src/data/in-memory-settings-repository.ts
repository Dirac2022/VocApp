import {
    DEFAULT_THEME_PREFERENCE,
    SettingsRepository,
    ThemePreference,
} from "./settings-repository";

/** Ajustes guardados en memoria. Se usa en pruebas */
export class InMemorySettingsRepository implements SettingsRepository {
    private theme: ThemePreference = DEFAULT_THEME_PREFERENCE;

    async getThemePreference(): Promise<ThemePreference> {
        return this.theme;
    }

    async setThemePreference(value: ThemePreference): Promise<void> {
        this.theme = value;
    }
}