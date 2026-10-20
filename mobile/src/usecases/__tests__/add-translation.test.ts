import { addTranslation } from "../add-translation";
import { makeRepo } from "../../test-support/repository";

/** Crea una frase con una traduccion y devuelve repositorio e identificador */
async function repoWithPhrase() {
    const repo = makeRepo();
    const phrase = await repo.insertPhraseWithTranslation({
        lang: "en",
        text: "dog",
        translationLang: "es",
        translationText: "perro",
    });

    return { repo, phraseId: phrase.id };
}

describe("addTranslation", () => {
    it("rechaza una traduccion que queda vacia al normalizar", async () => {
        const { repo, phraseId } = await repoWithPhrase();

        const result = await addTranslation(repo, { phraseId, lang: "es", text: "  ¿?  " });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("empty_translation");
        }
    });

    it("rechaza cuando la frase no existe", async () => {
        const result = await addTranslation(makeRepo(), {
            phraseId: "no-existe",
            lang: "es",
            text: "perro",
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("phrase_not_found");
        }
    });

    it("agrega una traduccion nueva", async () => {
        const { repo, phraseId } = await repoWithPhrase();

        const result = await addTranslation(repo, { phraseId, lang: "es", text: "can" });

        expect(result.ok).toBe(true);

        if (result.ok) {
            expect(result.outcome).toBe("added");
            expect(result.phrase.translations).toHaveLength(2);
        }
    });

    it("detecta que la traduccion ya existia aunque cambien mayusculas y puntuacion", async () => {
        const { repo, phraseId } = await repoWithPhrase();

        const result = await addTranslation(repo, { phraseId, lang: "es", text: "  Perro. " });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.outcome).toBe("already_existed");
            expect(result.phrase.translations).toHaveLength(1);
        }
    });
});