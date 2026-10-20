import { InMemoryPhraseRepository } from "../data/in-memory-phrase-repository";
import { IdGenerator } from "../data/phrase-repository";

/**
 * Generador de identificadores predecible: id-1, id-2, id-3, ...
 */
export function counterIds(): IdGenerator {
    let n = 0;
    return () => `id-${++n}`;
}

/**
 * Repositorio en memoria vacio, con identificadores predecibles
 * 
 * Es una funcion y no un repositorio compartido a proposito: cada
 * prueba debe partir desde cero.
 */
export function makeRepo(): InMemoryPhraseRepository {
    return new InMemoryPhraseRepository(counterIds());
}