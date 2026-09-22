import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { buildHint, checkAnswer } from './src/domain/answer';
import { Phrase } from './src/domain/types';


export default function App() {

  const sample: Phrase = {
    id: 'demo-1',
    lang: 'en',
    text: "It's raining cats and dogs",
    createdAt: '2026-09-22T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
    translations: [
      { id: 'demo-t1', phraseId: 'demo-1', lang: 'es', text: 'Llueve a cántaros', createdAt: '2026-09-22T00:00:00.000Z' },
      { id: 'demo-t2', phraseId: 'demo-1', lang: 'es', text: 'Esta lloviendo muchísimo', createdAt: '2026-09-22T00:00:00.000Z' },
    ],
  };
  return (
    <View style={styles.container}>
      <Text>Hola VocApp</Text>
      <Text>{sample.text}</Text>
      <Text>Pista: {buildHint(sample)}</Text>
      <Text>{checkAnswer(sample, 'llueve a cantaros.', false).outcome}</Text>
      <Text>{checkAnswer(sample, 'llueve mucho', true).outcome}</Text>
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
