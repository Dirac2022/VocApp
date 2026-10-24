import { Pressable, StyleSheet, Text, View } from "react-native";
import { BackupFeedback, useBackup } from "./use-backup";

/**Convierte el estado de la operacion en el mensaje visible, o en nada */
function feedbackText(feedback: BackupFeedback): string | null {
    switch (feedback.kind) {
        case "idle":
        case "working":
            return null;
        case "exported":
            return "Respaldo entregado. Comprueba que llego a su destino.";
        case "saved":
            return "Respaldo guardado en la carpeta que elegiste."
        case "imported":
            return (
                `Archivo con ${feedback.summary.phrasesInFile} frases. ` +
                `Nuevas: ${feedback.summary.phrasesCreated}. ` +
                `Traducciones agregadas: ${feedback.summary.translationsAdded}. ` +
                `Saltadas: ${feedback.summary.skipped}.`
            );
        case "cancelled":
            return "No se eligió ningún archivo";
        case "rejected":
            switch (feedback.reason) {
                case "invalid_json":
                    return "Ese archivo no es un JSON valido";
                case "not_an_object":
                    return "Ese archivo no tiene la forma de un respaldo";
                case "unsupported_version":
                    return "Ese respaldo es de una version que esta app no entiende.";
                case "invalid_shape":
                    return "El respaldo tiene datos incompletos o mal formados.";
            }
        case "error":
            return feedback.message;
    }
}

export function BackupScreen() {
    const { feedback, exportNow, importNow, saveToFolder } = useBackup();

    const working = feedback.kind === "working";
    const message = feedbackText(feedback);
    const isProblem = feedback.kind === "rejected" || feedback.kind === "error";

    return (
        <View style={styles.container}>
            <Text style={styles.paragraph}>
                El respaldo guarda todas tus frases y traducciones en un archivo JSON. Guardarlo en
                una carpeta del telefono es lo más fiable; compartirlo lo envía a otra app, que decide
                que hacer con el.
            </Text>

            <Pressable style={styles.primary} onPress={exportNow} disabled={working}>
                <Text style={styles.primaryText}>
                    {working ? "Trabajando..." : "Exportar respaldo"}
                </Text>
            </Pressable>

            <Text style={styles.paragraph}>
                Importar <Text style={styles.bold}>agrega</Text> lo que falte y no borra nada de lo
                que ya tengas. Hacerlo dos veces con el mismo archivo no duplica frases.
            </Text>

            <Pressable style={styles.secondary} onPress={importNow} disabled={working}>
                <Text style={styles.secondaryText}>
                    {working ? "Trabajando..." : "Importar respaldo"}
                </Text>
            </Pressable>

            <Pressable style={styles.secondary} onPress={saveToFolder} disabled={working}>
                <Text style={styles.secondaryText}>
                    {working ? "Trabajando..." : "Guardar en una carpeta del telefono"}
                </Text>
            </Pressable>

            {message !== null && (
                <Text style={isProblem ? styles.problem : styles.ok}>{message}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff', gap: 12 },
    paragraph: { fontSize: 14, color: '#444', lineHeight: 20, marginTop: 8 },
    bold: { fontWeight: 'bold' },
    primary: { backgroundColor: '#1f6feb', borderRadius: 8, padding: 14, alignItems: 'center' },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondary: {
        borderWidth: 1,
        borderColor: '#1f6feb',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    secondaryText: { color: '#1f6feb', fontSize: 16 },
    ok: { color: '#1a7f37', marginTop: 8 },
    problem: { color: '#b00020', marginTop: 8 },
});