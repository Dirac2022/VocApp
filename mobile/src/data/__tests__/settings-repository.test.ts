import { InMemorySettingsRepository } from "../in-memory-settings-repository";
import { parseThemePreference } from "../settings-repository";

describe("parseThemePreference", () => {
    it("acepta los tres valores validos", () => {
        expect(parseThemePreference("system")).toBe("system");
        expect(parseThemePreference("light")).toBe("light");
        expect(parseThemePreference("dark")).toBe("dark");
    });

    it("cae en system ante un valor desconocido", () => {
        expect(parseThemePreference("azul")).toBe("system");
        expect(parseThemePreference("")).toBe("system");
    });

    it("cae en system ante algo que no es texto", () => {
        expect(parseThemePreference(null)).toBe("system");
        expect(parseThemePreference(undefined)).toBe("system");
        expect(parseThemePreference(7)).toBe("system");
        expect(parseThemePreference({ kind: "dark" })).toBe("system");
    });

});

describe("InMemorySettingsRepository", () => {
    it("empieza siguiendo al sistema", async () => {
        expect(await new InMemorySettingsRepository().getThemePreference()).toBe("system");
    });

    it("guarda y devuelve la preferencia elegida", async () => {
        const settings = new InMemorySettingsRepository();

        await settings.setThemePreference("dark");

        expect(await settings.getThemePreference()).toBe("dark");
    });
});