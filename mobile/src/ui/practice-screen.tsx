import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CheckResult } from "../domain/answer";
import { usePractice } from "./use-practice";

/** Traduce el veredicto a algo legible */
function verdictText(result: CheckResult): string {
    switch (result.outcome) {
        case "correct":
            return "Correcto";
        case "correct_with_hint":
            return "Correcto, con pista";
        case "incorrect":
            return "Incorrecto";
        case "revealed":
            return "Respuesta revelada";
    }
}

export function PracticeScreen() {
    const {
        status,
        round,
        answer,
        hintVisible,
        result,
        errorMessage,
        setAnswer,
        showHint,
        check,
        reveal,
        next,
    } = usePractice();

    if (status === "error") {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>{errorMessage}</Text>
            </View>
        );
    }

    if (status === "empty" || round === null) {
        return (
            <View style={styles.centered}>
                <Text style={styles.hint}>
                    Tu diccionario esta vacio. Agrega frases para poder practicar
                </Text>
            </View>
        );
    }

    const answered = result != null;

    return (
        <View style={styles.container}>
            <Text style={styles.phrase}>{round.phrase.text}</Text>

            {hintVisible && <Text style={styles.hintText}>{round.hint}</Text>}

            <TextInput
                style={styles.input}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Escribe la traduccion"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!answered}
                onSubmitEditing={check}
            />

            {!answered && (
                <View style={styles.actions}>
                    <Pressable style={styles.primary} onPress={check}>
                        <Text style={styles.primaryText}>Comprobar</Text>
                    </Pressable>
                    <Pressable style={styles.secondary} onPress={showHint}>
                        <Text style={styles.secondaryText}>Pista</Text>
                    </Pressable>
                    <Pressable style={styles.secondary} onPress={reveal}>
                        <Text style={styles.secondaryText}>Ver traducciones</Text>
                    </Pressable>

                </View>
            )}

            {answered && (
                <View style={styles.resultBox}>
                    <Text style={styles.verdict}>{verdictText(result)}</Text>
                    <Text style={styles.label}>Traducciones validas</Text>
                    {round.phrase.translations.map((translation) => (
                        <Text key={translation.id} style={styles.translation}>
                            {translation.text}
                        </Text>
                    ))}
                    <Pressable style={styles.primary} onPress={next}>
                        <Text style={styles.primaryText}>Siguiente</Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    phrase: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    hintText: { fontSize: 18, letterSpacing: 2, color: "#666", marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    actions: { gap: 8 },
    primary: { backgroundColor: "#1f6feb", borderRadius: 8, padding: 14, alignItems: "center" },
    primaryText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    secondary: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, alignItems: "center" },
    secondaryText: { color: "#1f6feb", fontSize: 16 },
    resultBox: { gap: 8 },
    verdict: { fontSize: 20, fontWeight: "bold" },
    label: { fontSize: 14, color: "#666", marginTop: 8 },
    translation: { fontSize: 16 },
    hint: { textAlign: "center", color: "#666" },
    error: { color: "#b00020", textAlign: "center" }
})