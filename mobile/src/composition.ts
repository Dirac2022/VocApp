import { openDatabase } from './data/database';
import { PhraseRepository } from './data/phrase-repository';
import { SQLitePhraseRepository } from './data/sqlite-phrase-repository';
import { seedDemoPhrases } from './data/seed-demo';

/**
 * Promesa del repositorio, creada una sola vez y reutilizada.
 * Se guarda la promesa y no el resultado: si dos pantallas lo piden a la vez,
 * ambas esperan la misma apertura en lugar de abrir la base de datos dos veces.
 */
let repositoryPromise: Promise<PhraseRepository> | null = null;

/** Devuelve el repositorio de frases de la aplicación, abriéndolo la primera vez. */
export function getPhraseRepository(): Promise<PhraseRepository> {
    if (repositoryPromise === null) {
        repositoryPromise = initialise();
    }
    return repositoryPromise;
}

async function initialise(): Promise<PhraseRepository> {
    const db = await openDatabase();
    const repository = new SQLitePhraseRepository(db);

    // TEMPORAL: se elimina en cuenta exista la pantalla de agregar frases.
    await seedDemoPhrases(repository);

    return repository;
}