import { assertParams } from '../sql-params';

describe('assertParams', () => {
    it("acepta cuando los marcadores y los valores coinciden", () => {
        expect(() =>
            assertParams("SELECT * FROM phrase WHERE lang = ? AND text_norm = ?", ["en", "dog"]),
        ).not.toThrow();
    });

    it("acepta una consulta sin marcadores con un arreglo vacio", () => {
        expect(() => assertParams("SELECT * FROM phrase", [])).not.toThrow();
    });

    it("lanza error cuando faltan valores", () => {
        expect(() => assertParams("SELECT * FROM phrase WHERE lang = ?", [])
        ).toThrow("SQL con 1 marcadores y 0 valores");
    })

    it("lanza error cuando sobran valores", () => {
        expect(() => assertParams("DELETE FROM phrase WHERE id = ?", ["a", "b"])).toThrow(
            "SQL con 1 marcadores y 2 valores",
        );
    });

    it("cuenta bien en una insercion larga", () => {
        const sql = `INSERT INTO translation (id, phrase_id, lang, text, text_norm, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
        expect(() => assertParams(sql, [1, 2, 3, 4, 5, 6])).toThrow(
            "SQL con 7 marcadores y 6 valores",
        );
    })
});