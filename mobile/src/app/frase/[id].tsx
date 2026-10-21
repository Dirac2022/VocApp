import { Stack, useLocalSearchParams } from "expo-router";
import { PhraseDetailScreen } from "../../ui/phrase-detail-screen";

export default function PhraseDetailRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <>
            <Stack.Screen options={{ title: "Frase" }} />
            <PhraseDetailScreen phraseId={id} />
        </>
    );
}