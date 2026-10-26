import { openDatabase } from './data/database';
import { PhraseRepository } from './data/phrase-repository';
import { SettingsRepository } from './data/settings-repository';
import { SQLitePhraseRepository } from './data/sqlite-phrase-repository';
import { SQLiteSettingsRepository } from './data/sqlite-settings-repository';

/** Los repositorios de la aplicacion, construidos sobre la misma conexion */
interface AppRepositories {
    phrases: PhraseRepository;
    settings: SettingsRepository;
}

/**
 * Promesa del repositorio, creada una sola vez y reutilizada.
 * Se guarda la promesa y no el resultado: si dos pantallas lo piden a la vez,
 * ambas esperan la misma apertura en lugar de abrir la base de datos dos veces.
 */
let repositoriesPromise: Promise<AppRepositories> | null = null;

function getRepositories(): Promise<AppRepositories> {
    if (repositoriesPromise === null) {
        repositoriesPromise = initialise();
    }
    return repositoriesPromise;
}

async function initialise(): Promise<AppRepositories> {
    const db = await openDatabase();

    return {
        phrases: new SQLitePhraseRepository(db),
        settings: new SQLiteSettingsRepository(db),
    };
}

/** Devuelve el repositorio de frases de la aplicacion */
export async function getPhraseRepository(): Promise<PhraseRepository> {
    return (await getRepositories()).phrases;
}

/** Devuelve el repositorio de ajustes de la aplicacion */
export async function getSettingsRepository(): Promise<SettingsRepository> {
    return (await getRepositories()).settings;
}