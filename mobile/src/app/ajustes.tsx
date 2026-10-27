import { Stack } from "expo-router";
import { SettingsScreen } from "../ui/settings-screen";

export default function SettingsRoute() {
    return (
        <>
            <Stack.Screen options={{ title: "Ajustes" }} />
            <SettingsScreen />
        </>
    );
}