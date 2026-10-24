import { useState } from "react";
import { getPhraseRepository } from "../composition";
import { exportBackupFile, pickBackupFile, saveBackupToFolder } from "../data/backup-file";
import {
    buildBackup,
    parseBackup,
    ParseBackupRejection,
    restoreBackup,
    RestoreSummary,
} from "../usecases/backup";

/** En que punto esta la operacion y que contarle a la persona. */
export type BackupFeedback =
    | { kind: 'idle' }
    | { kind: 'working' }
    | { kind: 'exported' }
    | { kind: 'imported'; summary: RestoreSummary }
    | { kind: 'cancelled' }
    | { kind: 'rejected'; reason: ParseBackupRejection }
    | { kind: 'error'; message: string }
    | { kind: 'saved' };

/** Lo que le hook entrega a la pantalla */
export interface BackupState {
    feedback: BackupFeedback;
    exportNow: () => void;
    importNow: () => void;
    saveToFolder: () => void;
}

/** Gobierna la exportacion y la importacion del diccionario */
export function useBackup(): BackupState {
    const [feedback, setFeedback] = useState<BackupFeedback>({ kind: "idle" });

    async function exportNow() {
        setFeedback({ kind: "working" });

        try {
            const repository = await getPhraseRepository();
            const backup = await buildBackup(repository);

            await exportBackupFile(JSON.stringify(backup, null, 2));

            setFeedback({ kind: "exported" });
        } catch (error) {
            setFeedback({ kind: "error", message: String(error) });
        }

    }

    async function importNow() {
        setFeedback({ kind: "working" });

        try {
            const raw = await pickBackupFile();

            if (raw === null) {
                setFeedback({ kind: "cancelled" });
                return;
            }

            const parsed = parseBackup(raw);

            if (!parsed.ok) {
                setFeedback({ kind: "rejected", reason: parsed.reason });
                return;
            }

            const repository = await getPhraseRepository();
            const summary = await restoreBackup(repository, parsed.backup);

            setFeedback({ kind: "imported", summary });
        } catch (error) {
            setFeedback({ kind: "error", message: String(error) });
        }
    }

    async function saveToFolder() {
        setFeedback({ kind: "working" });

        try {
            const repository = await getPhraseRepository();
            const backup = await buildBackup(repository);

            const uri = await saveBackupToFolder(JSON.stringify(backup, null, 2));

            if (uri === null) {
                setFeedback({ kind: "cancelled" });
                return;
            }

            setFeedback({ kind: "saved" });
        } catch (error) {
            setFeedback({ kind: "error", message: String(error) });
        }
    }

    return { feedback, exportNow, importNow, saveToFolder };
}