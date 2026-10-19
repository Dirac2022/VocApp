import { Stack } from "expo-router";
import { AddPhraseScreen } from "../ui/add-phrase-screen";

export default function AddPhraseRoute() {
    return (
        <>
            <Stack.Screen options={{ title: "Agregar frase" }} />
            <AddPhraseScreen />
        </>
    );
}