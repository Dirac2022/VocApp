import { Stack } from "expo-router";
import { BackupScreen } from "../ui/backup-screen";

export default function BackupRoute() {
    return (
        <>
            <Stack.Screen options={{ title: "Respaldo" }} />
            <BackupScreen />
        </>
    );
}