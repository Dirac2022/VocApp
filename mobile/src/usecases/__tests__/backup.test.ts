import { makeRepo } from "../../test-support/repository";
import { BACKUP_SCHEMA_VERSION, buildBackup, parseBackup } from "../backup";

const FIXED_NOW = "2026-10-20T10:00:00.000Z";

describe("buildBackup", () => {
    it("arma un respaldo vacio cuando no hay frases", async () => {
        const backup = await buildBackup(makeRepo(), FIXED_NOW);

        expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
        expect(backup.exportedAt).toBe(FIXED_NOW);
        expect(backup.phrases).toEqual([]);
    });

    it("incluye las frases con sus traducciones", async () => {
        const repo = makeRepo();
        const phrase = await repo.insertPhraseWithTranslation({
            lang: "en",
            text: "dog",
            translationLang: "es",
            translationText: "perro",
        });

        await repo.insertTranslation({ phraseId: phrase.id, lang: "es", text: "can" });

        const backup = await buildBackup(repo, FIXED_NOW);

        expect(backup.phrases).toHaveLength(1);
        expect(backup.phrases[0].text).toBe("dog");
        expect(backup.phrases[0].translations.map((t) => t.text)).toEqual(["perro", "can"]);
    });

    it("no incluye el texto normalizado en el archivo", async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: "en",
            text: "dog",
            translationLang: "es",
            translationText: "perro",
        });

        const backup = await buildBackup(repo, FIXED_NOW);
        const asText = JSON.stringify(backup);

        expect(asText).not.toContain("text_norm");
        expect(asText).not.toContain("textNorm");
    });
});

describe("parseBackup", () => {
    /** Un respaldo minimo y valido, como texto */
    function validRaw(): string {
        return JSON.stringify({
            schemaVersion: BACKUP_SCHEMA_VERSION,
            exportedAt: FIXED_NOW,
            phrases: [
                {
                    id: "p1",
                    lang: "en",
                    text: "dog",
                    createdAt: FIXED_NOW,
                    updatedAt: FIXED_NOW,
                    translations: [
                        {
                            id: "t1",
                            lang: "es",
                            text: "perro",
                            createdAt: FIXED_NOW,
                            updatedAt: "FIXED_NOW",
                        },
                    ],
                },
            ],
        });
    }

    it("acepta un respaldo valido", () => {
        const result = parseBackup(validRaw());

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.backup.phrases).toHaveLength(1);
            expect(result.backup.phrases[0].translations[0].text).toBe("perro");
        }
    });

    it("rechaza texto que no es JSON", () => {
        const result = parseBackup("esto no es json");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("invalid_json");
        }
    });

    it("rechaza un JSON que no es un objecto", () => {
        const result = parseBackup("[1, 2, 3]");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("not_an_object");
        }
    });

    it("rechaza una version de formato desconocida", () => {
        const result = parseBackup(
            JSON.stringify({ schemaVersion: 99, exportedAt: FIXED_NOW, phrases: [] }),
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("unsupported_version")
        }
    });

    it("rechaza una frase sin texto", () => {
        const result = parseBackup(
            JSON.stringify({
                schemaVersion: BACKUP_SCHEMA_VERSION,
                exportedAt: FIXED_NOW,
                phrases: [{ id: "p1", lang: "en", text: " ", translations: [] }],
            }),
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("invalid_shape");
        }
    });

    it("rechaza un idioma desconocido", () => {
        const result = parseBackup(
            JSON.stringify({
                schemaVersion: BACKUP_SCHEMA_VERSION,
                exportedAt: FIXED_NOW,
                phrases: [{ id: "p1", lang: "fr", text: "chien", translations: [] }],
            }),
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("invalid_shape");
        }
    });

    it("sobrevive a un respaldo exportado por la propia app", async () => {
        const repo = makeRepo();
        await repo.insertPhraseWithTranslation({
            lang: "en",
            text: "dog",
            translationLang: "es",
            translationText: "perro",
        });

        const backup = await buildBackup(repo, FIXED_NOW);
        const result = parseBackup(JSON.stringify(backup));

        expect(result.ok).toBe(true);
    })
})