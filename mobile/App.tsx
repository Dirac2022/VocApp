import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { normalize } from './src/domain/normalize';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hola VocApp</Text>
      <Text>{normalize(' ¡El Perro Marrón! ')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
