import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Link } from "expo-router";
import { Phrase } from '../domain/types';
import { DictionaryStatus, useDictionary } from './use-dictionary';
import { Theme } from "./theme";
import { useTheme, useThemedStyles } from "./theme-context";

/** Una fila de la lista: la frase en inglés y sus traducciones debajo */
function PhraseItem({ phrase }: { phrase: Phrase }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <Link href={{ pathname: "/frase/[id]", params: { id: phrase.id } }} asChild>
            <Pressable style={styles.row}>
                <Text style={styles.english}>{phrase.text}</Text>
                <Text style={styles.spanish}>
                    {phrase.translations.map(((t) => t.text)).join(' · ')}
                </Text>
            </Pressable>

        </Link>
    );
}

/** La zona que cambia: ruedecita, error, aviso de la lista vacia o la lista */
function DictionaryBody({
    status,
    phrases,
    errorMessage,
    term
}: {
    status: DictionaryStatus;
    phrases: Phrase[];
    errorMessage: string;
    term: string;
}) {
    const styles = useThemedStyles(makeStyles);
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
                <Text style={styles.error}>{errorMessage}</Text>
            </View>
        );
    }

    if (phrases.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.hint}>
                    {term.trim() === ""
                        ? "Tu diccionario esta vacío. Agrega tu primera frase."
                        : "Ninguna frase coincide con la búsqueda."}
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={phrases}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PhraseItem phrase={item} />}
            keyboardShouldPersistTaps="handled"
        />
    );
}

export function DictionaryScreen() {
    const { status, phrases, errorMessage, term, setTerm } = useDictionary();
    const styles = useThemedStyles(makeStyles);
    const { theme } = useTheme();
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.search}
                value={term}
                onChangeText={setTerm}
                placeholder='Buscar frase o traducción'
                placeholderTextColor={theme.textMuted}
                autoCapitalize='none'
                autoCorrect={false}
            />

            <Text style={styles.count}>
                {phrases.length === 1 ? "1 frase" : `${phrases.length} frases`}
            </Text>

            <DictionaryBody
                status={status}
                phrases={phrases}
                errorMessage={errorMessage}
                term={term}
            />
        </View>
    );
}

const makeStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
            paddingTop: 12,
            paddingHorizontal: 16,
        },
        search: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            color: theme.text,
        },
        count: { fontSize: 13, color: theme.textMuted, marginTop: 8, marginBottom: 4 },
        centered: {
            flex: 1,
            backgroundColor: theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
        },
        title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: theme.text },
        row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
        english: { fontSize: 16, color: theme.text },
        spanish: { fontSize: 14, color: theme.textMuted, marginTop: 2 },
        hint: { marginTop: 8, color: theme.textMuted },
        error: { color: theme.danger, textAlign: 'center' },
    });