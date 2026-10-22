# Arquitectura

## Estilo y justificación

**Monolito en el teléfono, organizado en capas, sin servidor.** Alcance personal: el skill de arquitectura no exige recorrer el árbol de decisión (monolito siempre). La única decisión con coste real de reversión es dónde viven los datos, resuelta en ADR-0001 con los criterios NFR-01 (sin internet), NFR-02 (costo cero) y NFR-03 (una persona aprendiendo React Native).

Lo que sí se decide con cuidado, porque es lo que hace posible la evolución, es la **organización interna** (ADR-0004): las pantallas no saben que existe SQLite.

## Componentes

Todos viven dentro de la misma app. Diagrama: [C3 Componentes de la app](diagrams.md#c3-componentes-de-la-app).

### Capa de presentación
- **Responsabilidad**: mostrar pantallas y capturar lo que el usuario toca o escribe.
- **Interfaz pública**: las pantallas Practicar, Agregar frase, Buscar y agregar traducción, Lista, Respaldo, Ajustes.
- **Tema visual**: un objeto `theme` con los colores de cada modo (claro y oscuro) y un proveedor de tema que toda pantalla lee. La preferencia (`system`, `light`, `dark`) se guarda en `app_setting`; con `system`, la app consulta al sistema operativo con `useColorScheme` y cambia en vivo si el usuario cambia el modo del teléfono. Ningún componente escribe un color literal: siempre lo toma del tema.
- **Depende de**: casos de uso.
- **Datos que posee**: ninguno persistente; solo el estado visual momentáneo (qué hay escrito en el campo).
- **Tecnología**: React Native con Expo, TypeScript.

### Casos de uso
- **Responsabilidad**: una función por acción del usuario. Orquesta: pide datos al repositorio, aplica reglas del dominio, devuelve un resultado a la pantalla.
- **Interfaz pública**: `getRandomPhrase`, `checkAnswer`, `buildHint`, `revealTranslations`, `addPhrase`, `addTranslation`, `searchPhrases`, `exportBackup`, `importBackup`, `getThemePreference`, `setThemePreference`.
- **Depende de**: dominio y la interfaz `PhraseRepository`.
- **Datos que posee**: ninguno.

### Dominio
- **Responsabilidad**: los tipos `Phrase` y `Translation`, la función `normalize` (S-02), la comparación de respuestas y la construcción de pistas. Cero dependencias de React Native o SQLite: es TypeScript puro, probable con pruebas unitarias.
- **Depende de**: nada.

### Puerto `PhraseRepository` (interfaz)
- **Responsabilidad**: declarar qué operaciones de datos existen, sin implementarlas.
- **Interfaz pública**: `getRandom(lang?)`, `findById`, `findByLangAndNormalizedText`, `search(term)` (busca en frases y traducciones, coincidencia por contenido), `listAll`, `insertPhraseWithTranslation`, `insertTranslation`, `deletePhrase`.

### Puerto `SettingsRepository` (interfaz)
- **Responsabilidad**: leer y escribir ajustes por clave. Separado de `PhraseRepository` porque los ajustes no viajan en el respaldo ni se sincronizarán en fase 2.
- **Interfaz pública**: `get(key)`, `set(key, value)`.

### Adaptador SQLite
- **Responsabilidad**: implementar `PhraseRepository` y `SettingsRepository` con SQL contra `expo-sqlite`. Contiene también el ejecutor de migraciones.
- **Depende de**: `expo-sqlite`, la interfaz del puerto.
- **Datos que posee**: tablas `phrase`, `translation` y `app_setting` en el archivo `vocapp.db`.
- **Fase 2**: se añade un adaptador HTTP con la misma interfaz. Ningún otro componente cambia.

## Flujos

### Practicar
Diagrama: [Secuencia Practicar](diagrams.md#secuencia-practicar).
1. La pantalla pide una frase al caso de uso.
2. El caso de uso pide al repositorio una frase al azar con sus traducciones.
3. La pantalla muestra el texto en inglés y un campo de texto; las traducciones no se muestran.
4. El usuario tiene tres caminos (RF-14):
   - **Responder**: escribe y pulsa Comprobar. El caso de uso normaliza la respuesta y la compara con cada traducción normalizada.
   - **Pista**: pulsa Pista. El dominio construye la pista a partir de la traducción más corta: primera letra de cada palabra y un guion por cada letra restante ("p _ _ _ _" para "perro"). El campo sigue activo; la respuesta posterior se marca como "con pista".
   - **Mostrar traducciones**: se rinde. Se revelan todas y el intento se marca como "revelado": no cuenta como acierto.
5. La pantalla muestra el resultado (acierto, fallo, con pista o revelado) y la lista completa de traducciones válidas, y ofrece Siguiente.
- **Fallos posibles**: diccionario vacío. El repositorio devuelve nulo y la pantalla invita a agregar la primera frase.
- **Preparado para v2**: el resultado de cada intento tiene cuatro valores (acierto, fallo, con pista, revelado). Cuando exista la tabla `attempt` (RF-08), ese valor se guarda tal cual; hoy solo se muestra.

### Agregar frase con traducción
1. El usuario escribe texto en inglés y una traducción.
2. El caso de uso normaliza ambos y busca si ya existe una frase con ese `text_en_norm`.
3. Si existe, redirige al flujo "agregar traducción" a esa frase (RF-04). Si no, inserta frase y traducción **en una sola transacción**.
- **Fallos posibles**: texto vacío (rechazado por el dominio antes de llegar a SQL y por `CHECK` en la tabla); transacción interrumpida (SQLite deshace ambas inserciones: nunca queda una frase sin traducción).
- **Idempotencia**: repetir la operación con el mismo texto no crea duplicados gracias a los índices únicos.

### Buscar y agregar traducción a frase existente
La pantalla combina las dos ideas propuestas: lista y autocompletado son la misma cosa.
1. Al abrir, el cuadro de búsqueda está vacío y debajo aparece la **lista completa** de frases, cada una en una línea recortada a unos 40 caracteres con puntos suspensivos, más el número de traducciones que tiene.
2. Mientras el usuario teclea, la lista se **filtra en vivo**: el caso de uso normaliza lo escrito y pide al repositorio las frases cuyo `text_norm` contenga ese término **o** que tengan alguna traducción cuyo `text_norm` lo contenga. Así sirve recordar "cats" de "It's raining cats and dogs", o recordar la traducción "llover a cántaros" y no la frase.
3. Para no consultar la base de datos en cada letra, la pantalla espera unos 250 ms desde la última tecla antes de buscar (técnica llamada *debounce*: "rebote"). Con S-01 vigente la consulta es instantánea igualmente.
4. El usuario toca una frase de la lista; se abre su detalle con las traducciones actuales y un campo para la nueva.
5. El caso de uso normaliza e inserta; si ya existía esa traducción normalizada para esa frase e idioma, informa sin error.
- **Fallos posibles**: ningún resultado. La pantalla ofrece "Agregar como frase nueva" con el texto ya escrito.

### Respaldo
1. Exportar: el caso de uso lee todo, arma un JSON `{ schemaVersion, exportedAt, phrases: [...] }` y lo entrega al sistema para compartir (Drive, correo).
2. Importar: lee el JSON, verifica `schemaVersion`, inserta lo que no exista (los UUID permiten saber qué ya está).

## Contratos de datos

Formato del respaldo JSON, versión 1:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-21T14:03:00.000Z",
  "phrases": [
    {
      "id": "uuid",
      "lang": "en",
      "text": "dog",
      "createdAt": "...",
      "updatedAt": "...",
      "translations": [
        { "id": "uuid", "lang": "es", "text": "perro", "createdAt": "...", "updatedAt": "..." }
      ]
    }
  ]
}
```

Regla: si el esquema de tablas cambia, `schemaVersion` sube y el importador sabe convertir versiones anteriores. Las columnas `text_norm` no se exportan: se recalculan al importar. Los ajustes (`app_setting`) no se exportan: pertenecen al dispositivo.

## Despliegue

| Entorno | Infraestructura | Diferencias |
|---|---|---|
| Desarrollo | PC Linux con Node 22 ejecutando el servidor de desarrollo de Expo; teléfono con Expo Go en la misma red Wi-Fi | La app se recarga al guardar un archivo |
| Uso diario (v1) | Misma app en Expo Go, o compilación de desarrollo instalada en el teléfono | Sin diferencias de datos: mismo archivo SQLite |
| Tienda (fase 3) | EAS Build genera el binario | Firma y cuenta de desarrollador |

## Seguridad

- Sin autenticación en v1: la app es local y el teléfono ya tiene bloqueo de pantalla. En v2, con servidor, se añade inicio de sesión OAuth2 (RF-11): la app obtiene un token de un proveedor como Google usando el flujo *Authorization Code + PKCE* (el recomendado para apps móviles, que no pueden guardar un secreto) y lo presenta al servidor en cada petición. Se anticipa aquí para que nada en v1 lo dificulte: no hace falta nada en el modelo local.
- Sin secretos en v1. `.gitignore` incluirá `.env` desde el primer commit (NFR-06).
- El archivo SQLite vive en el almacenamiento privado de la app; otras apps no pueden leerlo sin root.
- El respaldo JSON contiene solo frases y traducciones: no hay dato sensible.

## Principios de diseño

La organización en capas es la aplicación concreta de los principios SOLID a este proyecto. Qué principio vive en qué pieza, y dónde no se aplica a propósito, está en `05-solid-en-vocapp.md`.

## Convenciones

- TypeScript en toda la app (es lo que genera la plantilla de Expo): los tipos hacen visibles los contratos entre capas, que es justo lo que este diseño quiere enseñar.
- Estructura de carpetas por capa en v1: `src/ui`, `src/usecases`, `src/domain`, `src/data`. Se reorganiza por funcionalidad si supera ~15 pantallas (ADR-0004).
