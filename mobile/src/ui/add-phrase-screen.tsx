import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AddPhraseFeedback, useAddPhraseForm } from "./use-add-phrase";

/** Convierte el estado del envio en el mensaje que se muestra, o nada. */
function feedbackText(feedback: AddPhraseFeedback): string | null {
    switch (feedback.kind) {
        case "idle":
        case "saving":
            return null;
        case "done":
            switch (feedback.outcome) {
                case "created":
                    return "Frase agregada";
                case "translation_added":
                    return "La frase ya existía: se agregó la traducción nueva";
                case "already_existed":
                    return "Esa frase y esa traducción ya estaban guardadas"
            }
        case "rejected":
            return feedback.reason === "empty_phrase"
                ? "Escribe la frase en ingles"
                : "Escribe la traduccion al español";
        case "error":
            return feedback.message;
    }
}

export function AddPhraseScreen() {
    const {
        phraseText,
        translationText,
        feedback,
        setPhraseText,
        setTranslationText,
        submit
    } = useAddPhraseForm();

    const saving = feedback.kind === "saving";
    const message = feedbackText(feedback);
    const isProblem = feedback.kind === "rejected" || feedback.kind === "error";

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Frase o palabra en ingles</Text>
            <TextInput
                style={styles.input}
                value={phraseText}
                onChangeText={setPhraseText}
                placeholder="It's raining cats and dogs"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
            />

            <Text style={styles.label}>Traducción al español</Text>
            <TextInput
                style={styles.input}
                value={translationText}
                onChangeText={setTranslationText}
                placeholder="Llueve a cántaros"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
                onSubmitEditing={submit}
            />

            <Pressable style={styles.primary} onPress={submit} disabled={saving}>
                <Text style={styles.primaryText}>{saving ? "Guardando..." : "Guardar"}</Text>
            </Pressable>

            {message !== null && (
                <Text style={isProblem ? styles.problem : styles.ok}>{message}</Text>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 8 },
    label: { fontSize: 14, color: "#666", marginTop: 8 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    primary: {
        backgroundColor: "#1f6feb",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
        marginTop: 16,
    },
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    ok: { color: "#1a7f37", marginTop: 8 },
    problem: { color: "#b00020", marginTop: 8 },
});