import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { AddTranslationFeedback, usePhraseDetail } from "./use-phrase-detail"

/** Convierte el estado del envio en el mensaje visible, o en nada */
function feedbackText(feedback: AddTranslationFeedback): string | null {
    switch (feedback.kind) {
        case "idle":
        case "saving":
            return null;
        case "done":
            return feedback.outcome === "added"
                ? "Traducción agregada"
                : "Esa traducción ya estaba guardada";
        case "rejected":
            return feedback.reason === "empty_translation"
                ? "Escribe la traducción"
                : "Esa frase ya no existe";
        case "error":
            return feedback.message;
    }
}

export function PhraseDetailScreen({ phraseId }: { phraseId: string }) {
    const {
        status,
        phrase,
        errorMessage,
        translationText,
        feedback,
        setTranslationText,
        submit
    } = usePhraseDetail(phraseId);

    if (status === "loading") {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (status === "error") {
        return (
            <View style={styles.centered}>
                <Text style={styles.problem}>{errorMessage}</Text>
            </View>
        );
    }

    if (status === "not_found" || phrase === null) {
        return (
            <View style={styles.centered}>
                <Text style={styles.hint}>Esa frase ya no existe</Text>
            </View>
        );
    }

    const saving = feedback.kind === "saving";
    const message = feedbackText(feedback);
    const isProblem = feedback.kind === "rejected" || feedback.kind === "error";

    return (
        <View style={styles.container}>
            <Text style={styles.phrase}>{phrase.text}</Text>

            <Text style={styles.label}>Traducciones guardadas</Text>
            {phrase.translations.map((translation) => (
                <Text key={translation.id} style={styles.translation}>
                    {translation.text}
                </Text>
            ))}
            <Text style={styles.label}>Agregar otra traducción</Text>
            <TextInput
                style={styles.input}
                value={translationText}
                onChangeText={setTranslationText}
                placeholder="Otra forma de decirlo"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                onSubmitEditing={submit}
            />

            <Pressable style={styles.primary} onPress={submit} disabled={saving}>
                <Text style={styles.primaryText}>{saving ? "Guardando..." : "Agregar"}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
    phrase: { fontSize: 24, fontWeight: 'bold' },
    label: { fontSize: 14, color: '#666', marginTop: 20, marginBottom: 6 },
    translation: { fontSize: 16, paddingVertical: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    primary: {
        backgroundColor: '#1f6feb',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        marginTop: 12,
    },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    ok: { color: '#1a7f37', marginTop: 10 },
    problem: { color: '#b00020', marginTop: 10, textAlign: 'center' },
    hint: { color: '#666', textAlign: 'center' },
});