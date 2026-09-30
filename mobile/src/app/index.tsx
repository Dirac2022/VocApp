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
            <Link
                href="/practicar"
                style={[styles.link, { paddingBottom: insets.bottom + 16 }]}
            >
                Ir a practicar
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    link: {
        padding: 16,
        textAlign: 'center',
        color: '#1f6feb',
        fontSize: 16,
    },
});