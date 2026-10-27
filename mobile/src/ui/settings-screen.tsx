import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemePreference } from '../data/settings-repository';
import { Theme } from './theme';
import { useTheme, useThemedStyles } from './theme-context';

/** Las tres opciones, con su texto. Fuera del componente: no cambian nunca. */
const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
    { value: 'system', label: 'Automatico', description: 'Sigue el modo del telefono' },
    { value: 'light', label: 'Claro', description: 'Siempre claro' },
    { value: 'dark', label: 'Oscuro', description: 'Siempre oscuro' },
];

export function SettingsScreen() {
    const { preference, setPreference } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Tema</Text>

            {OPTIONS.map((option) => {
                const selected = option.value === preference;

                return (
                    <Pressable
                        key={option.value}
                        style={[styles.option, selected && styles.optionSelected]}
                        onPress={() => setPreference(option.value)}
                    >
                        <View style={styles.optionText}>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            <Text style={styles.optionDescription}>{option.description}</Text>
                        </View>
                        {selected && <Text style={styles.check}>OK</Text>}
                    </Pressable>
                );
            })}
        </View>
    );
}

const makeStyles = (theme: Theme) =>
    StyleSheet.create({
        container: { flex: 1, padding: 16, gap: 8, backgroundColor: theme.background },
        label: { fontSize: 14, color: theme.textMuted, marginBottom: 4 },
        option: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 14,
            backgroundColor: theme.surface,
        },
        optionSelected: { borderColor: theme.primary },
        optionText: { flex: 1 },
        optionLabel: { fontSize: 16, color: theme.text },
        optionDescription: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
        check: { fontSize: 16, color: theme.primary, fontWeight: 'bold' },
    });