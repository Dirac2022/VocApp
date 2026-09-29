import { StatusBar } from 'expo-status-bar';
import { DictionaryScreen } from './src/ui/dictionary-screen';

export default function App() {
  return (
    <>
      <DictionaryScreen />
      <StatusBar style="auto" />
    </>
  );
}