import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DictionaryScreen } from '../ui/dictionary-screen';

export default function DictionaryRoute() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Diccionario' }} />

            <View style={styles.content}>
                <DictionaryScreen />
            </View>

            <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
                <Link href="/agregar" style={styles.link}>Agregar frase</Link>
                <Link href="/practicar" style={styles.link}>Practicar</Link>
                <Link href="/respaldo" style={styles.link}>Respaldo</Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    bar: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 12,
        backgroundColor: "#fff",
    },
    link: { color: "#1f6feb", fontSize: 16 }
});