import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

/** Nombre del archivo de base de datos dentro del almacenamiento privado de la app. */
const DATABASE_NAME = 'vocapp.db'

/**
 * Abre la base de datos, aplica la configuracion obligatoria y ejecuta
 * las migraciones pendientes. Es el unico lugar que debe abrir la conexion
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await db.execAsync('PRAGMA foreign_keys = ON');
    await db.execAsync('PRAGMA journal_mode = WAL');

    await runMigrations(db);
    return db;
}

/**
 * Aplica las migraciones que falten, en orden, cada una dentro de una transaccion.
 * @returns La version de esquema en la que queda la base de datos.
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let current = row?.user_version ?? 0;

    if (current > MIGRATIONS.length) {
        throw new Error(
            `La base de datos está en la versión ${current}, pero esta versión de la app ` +
            `solo conoce hasta la ${MIGRATIONS.length}. Instala una versión más reciente de VocApp.`
        );
    }

    for (let version = current + 1; version <= MIGRATIONS.length; version++) {
        const sql = MIGRATIONS[version - 1];

        await db.withTransactionAsync(async () => {
            await db.execAsync(sql);
            // PRAGMA no admite parametros: se interpola. Es seguro porque
            // 'version' es el contador del bucle, nunca entrada de la persona
            await db.execAsync(`PRAGMA user_version = ${version}`);
        });
        current = version;
    }
    return current;
}