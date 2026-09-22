# Modelo de dominio

## Glosario

Los documentos y la conversación están en español; los identificadores del código y de las tablas están en inglés, porque todas las librerías, mensajes de error y documentación de React Native lo están, y mezclar idiomas dentro del código (`getFrases`) es peor que elegir uno. Esta tabla es el puente.

| Término (conversación) | Identificador (código y tablas) | Definición | Sinónimos a evitar |
|---|---|---|---|
| Frase | `phrase` / `Phrase` | Texto en un idioma de origen que se practica. Puede ser una palabra sola ("dog") o una frase ("It's raining cats and dogs") | palabra, entrada, tarjeta |
| Traducción | `translation` / `Translation` | Una respuesta en el idioma de destino aceptada como correcta para una frase. Una frase tiene una o más | respuesta, significado |
| Idioma | `lang` | Código ISO 639-1 de dos letras: `en`, `es`, `pt`. La frase lleva el de origen; la traducción, el de destino | lenguaje, language |
| Texto normalizado | `text_norm` | Versión del texto en minúsculas, sin acentos, sin espacios repetidos ni puntuación final. Se usa para buscar, comparar y evitar duplicados | — |
| Practicar | `practice` | Ver una frase al azar, escribir la traducción, recibir corrección | quiz, test |
| Diccionario | (conjunto de todas las frases) | El total de frases y traducciones del usuario | lista, base |
| Ajuste | `app_setting` / `Setting` | Una preferencia de la app, como el tema visual. No es dato del diccionario | config, preferencia |
| Respaldo | `backup` | Archivo JSON con el diccionario completo y el número de versión del esquema | export |

## Entidades

### Phrase (Frase)
- **Responsabilidad**: representar un texto en un idioma de origen que el usuario quiere aprender.
- **Identidad**: `id` UUID v4 generado en la app (ADR-0005). Clave natural: el par (`lang`, `text_norm`), único. "dog" en inglés y "dog" en portugués (si existiera) serían frases distintas; "Dog" y "dog " en inglés son la misma (RF-04).
- **Ciclo de vida**: sin estados. Existe o no existe.
- **Dueño**: módulo de dominio; persistida por el adaptador SQLite.

### Translation (Traducción)
- **Responsabilidad**: una respuesta en un idioma de destino aceptada para una frase.
- **Identidad**: `id` UUID v4. Clave natural: la terna (`phrase_id`, `lang`, `text_norm`), única: la misma traducción no se repite dentro de una frase y un idioma, pero sí puede existir en frases distintas ("perro" puede ser traducción de "dog" y de "hound").
- **Ciclo de vida**: sin estados.
- **Dueño**: pertenece a una Phrase; si la frase se borra, sus traducciones se borran con ella (`ON DELETE CASCADE`).

### Setting (Ajuste)
- **Responsabilidad**: guardar una preferencia de la app como par clave-valor. En v1 solo `theme` con valores `system`, `light`, `dark`.
- **Identidad**: `key`, la propia clave.
- **Dueño**: capa de presentación a través del repositorio de ajustes. **No forma parte del respaldo**: son preferencias del dispositivo, no del diccionario.

## Relaciones

| Relación | Cardinalidad | Obligatoriedad | Al borrar |
|---|---|---|---|
| Phrase tiene Translation | 1 a muchos | Una traducción siempre pertenece a exactamente una frase (`phrase_id NOT NULL`). Una frase debe tener al menos una traducción: regla de negocio que garantiza la app en una transacción, porque SQLite no puede expresar "al menos un hijo" como restricción | `CASCADE`: borrar la frase borra sus traducciones |

`app_setting` no se relaciona con nada: es una tabla independiente.

## Idiomas: preparado hoy, usado mañana (ADR-0006)

En v1 todas las frases son `lang = 'en'` y todas las traducciones `lang = 'es'`. Las columnas existen desde el primer día porque cambiar después la clave de unicidad de `text_norm` a (`lang`, `text_norm`) con datos guardados es una migración delicada, mientras que hoy es gratis. Cuando llegue portugués → español (RF-13):

- Agregar frase pide el idioma de origen (por defecto el último usado).
- Practicar filtra por el idioma que el usuario quiera repasar, o mezcla todos.
- Ninguna tabla cambia.

La lista de idiomas permitidos vive en código TypeScript por ahora (`en`, `es`, `pt`), no en una tabla. Si algún día el usuario debe gestionar idiomas desde la app, se crea una tabla `language` y se le apunta con clave foránea: una migración que solo añade, no modifica.

## Atributos y tipos en SQLite

SQLite tiene solo cinco clases de almacenamiento: `NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB`. No existen `UUID`, `BOOLEAN`, `DATE` ni `VARCHAR(n)`. Se decide así:

| Dato | Tipo SQLite | Por qué |
|---|---|---|
| Identificadores UUID | `TEXT` | 36 caracteres; comparables y indexables como texto |
| Fechas | `TEXT` en formato ISO 8601 UTC (`2026-09-21T14:03:00.000Z`) | Ordena correctamente como texto y es legible; SQLite tiene funciones de fecha que lo entienden |
| Códigos de idioma | `TEXT` de 2 caracteres con `CHECK` | Estándar ISO 639-1; legible; sin tabla que mantener en v1 |
| Textos | `TEXT` | Sin límite de longitud que declarar |

Nota para no confundirse: la columna se llama `text` y su tipo también es `TEXT`. En SQL se escribe `text TEXT NOT NULL`: primero el nombre, luego el tipo. `text` no es palabra reservada en SQLite, así que es válido.

## Normalización

El modelo está en tercera forma normal: cada tabla tiene una clave, cada atributo depende de la clave completa y no hay atributos que se deduzcan de otros no clave.

**Desnormalización dirigida y declarada**: la columna `text_norm` se puede calcular a partir de `text`, así que técnicamente es redundante. Se guarda igualmente porque es la columna sobre la que se busca y sobre la que se declara la unicidad, y SQLite no puede indexar el resultado de una función escrita en JavaScript. La app calcula la columna normalizada en el momento de escribir; ningún otro código la modifica.

## Consultas reales (base para los índices)

| # | Consulta | Frecuencia | Índice que la sirve |
|---|---|---|---|
| Q1 | Una frase al azar, opcionalmente filtrada por `lang` | cada pregunta | ninguno (recorre la tabla; aceptable bajo S-01) |
| Q2 | Traducciones de una frase | cada pregunta | `ix_translation_phrase_id` |
| Q3 | Buscar frases cuyo `text_norm` **contenga** un término, o alguna de cuyas traducciones lo contenga | mientras el usuario teclea | ninguno: `LIKE '%term%'` no usa índice. Aceptable bajo S-01; FTS5 si duele (punto de ruptura 2) |
| Q4 | Comprobar si existe una frase con (`lang`, `text_norm`) exacto | al agregar | `uq_phrase_lang_text_norm` |
| Q5 | Insertar frase + primera traducción | al agregar | transacción; índices únicos comprueban duplicados |
| Q6 | Insertar traducción a frase existente | al agregar | `uq_translation_phrase_lang_text_norm` |
| Q7 | Listar todas las frases ordenadas por fecha | pantalla de lista | `created_at` se ordena en memoria; sin índice hasta que duela |
| Q8 | Exportar todo | ocasional | ninguno |
| Q9 | Leer y escribir un ajuste por clave | al arrancar y al cambiar tema | clave primaria de `app_setting` |

## Restricciones en el esquema

- `NOT NULL` en todas las columnas: no existe una frase sin texto ni una traducción sin frase.
- `UNIQUE (lang, text_norm)` en `phrase`, como índice con nombre `uq_phrase_lang_text_norm`. Se declara como índice separado y no como restricción dentro de la columna para que una migración futura pueda reemplazarlo con `DROP INDEX` y `CREATE INDEX` sin recrear la tabla.
- `UNIQUE (phrase_id, lang, text_norm)` en `translation`, índice `uq_translation_phrase_lang_text_norm`.
- `FOREIGN KEY (phrase_id) REFERENCES phrase(id) ON DELETE CASCADE`. Requiere `PRAGMA foreign_keys = ON` en cada conexión, porque SQLite las trae apagadas por defecto.
- `CHECK (length(trim(text)) > 0)`: una cadena vacía no es una frase ni una traducción.
- `CHECK (length(lang) = 2)` en ambas tablas.
- `CHECK (key IN ('theme'))` en `app_setting` en v1; cada nuevo ajuste amplía la lista con una migración.

## Diagrama ER

Ver [ER Modelo de datos](diagrams.md#er-modelo-de-datos).

## Entidades futuras (no se crean hoy)

- **Attempt (Intento)**: registro de cada respuesta dada (frase, respuesta, acierto, fecha). Habilita RF-08 y RF-09. Tabla nueva con FK a `phrase`; migración barata.
- **Language (Idioma)**: tabla de referencia si el usuario gestiona idiomas desde la app. Ver sección de idiomas.
- **User (Usuario)**: solo en el servidor de fase 2 (RF-11). El modelo local sigue siendo de un usuario.
