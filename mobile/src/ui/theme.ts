/**
 * Los colores de la app, nombrados por su funcion y no por su tono
 */
export interface Theme {
    /** Fondo de la pantalla completa */
    background: string;
    /** Fondo de bloques que se levantan sobre el fondo: cabeceras, tarjetas */
    surface: string;
    /** Texto principal */
    text: string;
    /** Texto secundario: etiquetas, pistas, ayudas */
    textMuted: string;
    /** Bordes de campos y separadores de listas */
    border: string;
    /** Color de acento: botones principales y enlaces */
    primary: string;
    /** Texto que va encima del color de acento */
    onPrimary: string;
    /** Confirmaciones */
    success: string;
    /** Errores */
    danger: string;
}

export const lightTheme: Theme = {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#1a1a1a',
    textMuted: '#666666',
    border: '#cccccc',
    primary: '#1f6feb',
    onPrimary: '#ffffff',
    success: '#1a7f37',
    danger: '#b00020',
}

export const darkTheme: Theme = {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#e6e6e6',
    textMuted: '#9e9e9e',
    border: '#3a3a3a',
    primary: '#58a6ff',
    onPrimary: '#0d1117',
    success: '#3fb950',
    danger: '#f85149',
}