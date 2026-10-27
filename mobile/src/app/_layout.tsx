import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../ui/theme-context';

/**
 * El navegador va en su propio componente porque useTheme solo funciona
 * DENTRO del proveedor, y RootLayout es quien lo monta: desde ahi todavia
 * no hay contexto que leer.
 */
function Navigation() {
    const { theme, scheme } = useTheme();

    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: theme.surface },
                    headerTintColor: theme.text,
                    contentStyle: { backgroundColor: theme.background },
                }}
            />
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <Navigation />
        </ThemeProvider>
    );
}