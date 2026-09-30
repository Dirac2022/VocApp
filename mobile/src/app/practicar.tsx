import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function PracticeRoute() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Practicar' }} />
            <Text>Aqui construiremos la pantalla de practicar</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
});