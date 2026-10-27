import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";
import { getSettingsRepository } from "../composition";
import { DEFAULT_THEME_PREFERENCE, ThemePreference } from "../data/settings-repository";
import { darkTheme, lightTheme, Theme } from "./theme";

/** Lo que cualquier pantalla puede pedirle al contexto */
interface ThemeContextValue {
    /** Los colores que toca usar ahora mismo */
    theme: Theme;
    /** El modo resultante, ya resuelto. Util para que la barra de estado */
    scheme: "light" | "dark";
    /** Lo que el usuario eligio: puede ser 'system' */
    preference: ThemePreference;
    /** Cambia la eleccion y la guarda en la base de datos */
    setPreference: (value: ThemePreference) => void;
}

/**
 * El valor inicial es null a proposito: si alguien lee el contexto sin que
 * haya un proveedor encima, queremos que falle con un mensaje claro en lugar
 * de recibir colores falsos y preguntarse por que no cambian.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Lo que dice el sistema operativo. "light", "dark" o "unspecified"
    const systemScheme = useColorScheme();

    // Lo que eligio el usuario. Empieza en 'system' y corrige al leer la BD.
    const [preference, setPreferenceState] = useState<ThemePreference>(
        DEFAULT_THEME_PREFERENCE,
    );

    useEffect(() => {
        // Bandera de cancelacion: si el proveedor se desmonta antes de que la
        // base de datos conteste, no intentamos tocar un estado que ya no existe.
        let active = true;

        getSettingsRepository()
            .then((settings) => settings.getThemePreference())
            .then((saved) => {
                if (active) {
                    setPreferenceState(saved);
                }
            })
            .catch(() => {
                // Si no se puede leer, se queda el valor por defecto
            });

        return () => {
            active = false;
        }
    }, []);

    const setPreference = useCallback((value: ThemePreference) => {
        // Primero la pantalla despues el disco: el color cambia al instante
        // y el guardado ocurre por detras.
        setPreferenceState(value);
        getSettingsRepository()
            .then((settings) => settings.setThemePreference(value))
            .catch(() => {
                // Guardar es lo accesorio; no vale la pena romper la pantalla
            });
    }, []);

    const scheme: "light" | "dark" =
        preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

    const value = useMemo<ThemeContextValue>(
        () => ({
            theme: scheme === "dark" ? darkTheme : lightTheme,
            scheme,
            preference,
            setPreference,
        }),
        [scheme, preference, setPreference],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Lee el tema actual. Falla si no hay un ThemeProvider por encima */
export function useTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);
    if (value === null) {
        throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
    }
    return value;
}

/**
 * Crea la hoja de estilos con los colores del tema actual.
 *
 * La fabrica debe declararse FUERA del componente (al nivel del archivo).
 * Si se escribe en linea dentro del componente, JavaScript crea una funcion
 * nueva en cada dibujado, el useMemo la ve distinta y rehace la hoja siempre.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
    const { theme } = useTheme();
    return useMemo(() => factory(theme), [theme, factory]);
}