import { Stack } from "expo-router";
import { PracticeScreen } from "../ui/practice-screen";

export default function PracticeRoute() {
    return (
        <>
            <Stack.Screen options={{ title: "Practicar" }} />
            <PracticeScreen />
        </>
    )
}