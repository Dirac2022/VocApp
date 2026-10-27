import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DictionaryScreen } from '../ui/dictionary-screen';
import { Theme } from "../ui/theme";
import { useThemedStyles } from "../ui/theme-context";

export default function DictionaryRoute() {
    const insets = useSafeAreaInsets();
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Diccionario',
                    headerRight: () => (
                        <Link href="/ajustes" style={styles.headerLink}>
                            Ajustes
                        </Link>
                    ),
                }}
            />

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

const makeStyles = (theme: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        content: { flex: 1 },
        bar: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingTop: 12,
            backgroundColor: theme.surface,
        },
        link: { color: theme.primary, fontSize: 16 },
        headerLink: { color: theme.primary, fontSize: 16, marginRight: 8 },
    });

