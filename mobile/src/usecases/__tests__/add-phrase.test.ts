import { InMemoryPhraseRepository } from "../../data/in-memory-phrase-repository";
import { IdGenerator } from "../../data/phrase-repository";
import { addPhrase } from "../add-phrase";

/** Generador predecible de identificadores: id-1, id-2, id-3... */
function counterIds(): IdGenerator {
    let n = 0;
    return () => `id-${++n}`;
}

function makeRepo(): InMemoryPhraseRepository {
    return new InMemoryPhraseRepository(counterIds());
}

/** Entrada base; cada prueba cambia solo lo que necesita */
function input(text: string, translationText: string) {
    return { lang: "en" as const, text, translationLang: "es" as const, translationText };
}

describe("addPhrase", () => {
    it("rechaza una frase que queda vacia al normalizar", async () => {
        const result = await addPhrase(makeRepo(), input("   ", "perro"));

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("empty_phrase");
        }
    });

    it("rechaza una traduccion que queda vacia al normalizar", async () => {
        const result = await addPhrase(makeRepo(), input("dog", " ¿?  "));

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe("empty_translation");
        }
    });

    it("crea la frase cuando no exista", async () => {
        const result = await addPhrase(makeRepo(), input("dog", "perro"));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.outcome).toBe("created");
            expect(result.phrase.translations).toHaveLength(1);
        }
    });

    it("agrega la traduccion cuando la frase ya existia", async () => {
        const repo = makeRepo();
        await addPhrase(repo, input("dog", "perro"));

        const result = await addPhrase(repo, input("Dog", "can"));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.outcome).toBe("translation_added");
            expect(result.phrase.translations).toHaveLength(2);
        }
        expect(await repo.listAll()).toHaveLength(1);
    });

    it("no guarda nada si la frase y la traduccion ya existian", async () => {
        const repo = makeRepo();
        await addPhrase(repo, input("dog", "perro"));

        const result = await addPhrase(repo, input(" DOG", "Perro "));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.outcome).toBe("already_existed");
            expect(result.phrase.translations).toHaveLength(1);
        }
    });
});