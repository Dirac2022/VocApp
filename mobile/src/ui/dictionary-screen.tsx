import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Phrase } from '../domain/types';
import { useDictionary } from './use-dictionary';

/** Una fila de la lista: la frase en inglés y sus traducciones debajo */
function PhraseItem({ phrase }: { phrase: Phrase }) {
    return (
        <View style={styles.row}>
            <Text style={styles.english}>{phrase.text}</Text>
            <Text style={styles.spanish}>
                {phrase.translations.map(((t) => t.text)).join(' · ')}
            </Text>
        </View>
    );
}

/** Lista del diccionario completo. */
export function DictionaryScreen() {
    const { status, phrases, errorMessage } = useDictionary();

    if (status === 'loading') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={styles.hint}>Abriendo la base de datos...</Text>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>{errorMessage}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Diccionario: {phrases.length}</Text>
            <FlatList
                data={phrases}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PhraseItem phrase={item} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 64, paddingHorizontal: 16 },
    centered: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    english: { fontSize: 16 },
    spanish: { fontSize: 14, color: '#666', marginTop: 2 },
    hint: { marginTop: 8 },
    error: { color: '#b00020', textAlign: 'center' },
});