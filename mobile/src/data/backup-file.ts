import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/** Nombre del archivo con la fecha, para distinguir respaldos entre si. */
function backupFileName(now: Date): string {
    const stamp = now.toISOString().slice(0, 10);
    return `vocapp-${stamp}.json`;
}

/**
 * Escribe el respaldo en la carpeta temporal y abre el menu de compartir
 * del sistema para que la persona elija donde guardarlo
 * 
 * @params contents El archivo ya convertido a texto
 * @throws Error si el dispositivo no permite compartir archivos
 */
export async function exportBackupFile(contents: string): Promise<void> {
    const file = new File(Paths.cache, backupFileName(new Date()));

    // overwrite evita que falle si hoy ya exportaste una vez
    file.create({ overwrite: true });
    await file.write(contents);

    if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Este dispositivo no permite compartir archivos");
    }

    await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Guardar respaldo de vocapp",
        UTI: "public.json",
    });
}

/**
 * Abre el explorador de archivos del sistema y devuelve el contenido del
 * archivo elegido.
 *
 * Usa el selector del propio expo-file-system y no el de expo-document-picker:
 * en Android el permiso para leer una direccion content:// se concede a un
 * destinatario concreto, y pasarla de un modulo a otro lo pierde. Eligiendo y
 * leyendo desde el mismo modulo, el permiso nunca cambia de manos.
 *
 * @returns El texto del archivo, o null si la persona cancelo.
 */
export async function pickBackupFile(): Promise<string | null> {
    const picked = await File.pickFileAsync({ mimeTypes: "*/*" });

    if (picked.canceled) {
        return null;
    }

    return picked.result.text();
}

/**
 * Pide a la persona que elija una carpeta del telefono y escribe el
 * respaldo dentro. A diferencia de compartir, aqui el archivo queda
 * guardado de verdad y se puede abrir desde el explorador.
 *
 * Limitacion conocida: cancelar el selector llega como un error y no se
 * puede distinguir de un fallo real de permisos, asi que ambos casos se
 * tratan como cancelacion. Es el mal menor, porque cancelar es lo comun.
 *
 * @param contents El archivo ya convertido a texto.
 * @returns La direccion del archivo creado, o null si no se eligio carpeta.
 */
export async function saveBackupToFolder(contents: string): Promise<string | null> {
    let directory: Directory;

    try {
        directory = await Directory.pickDirectoryAsync();
    } catch {
        return null;
    }

    const file = directory.createFile(backupFileName(new Date()), "application/json");
    await file.write(contents);

    return file.uri;
}