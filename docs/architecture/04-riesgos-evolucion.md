# Riesgos y evolución

El skill de arquitectura permite omitir este documento en alcance personal. Se incluye de todos modos porque el objetivo de aprendizaje 2 es exactamente esto: **saber cuál es el siguiente paso sin darlo todavía**.

## Puntos de ruptura

| # | Componente | Umbral | Síntoma esperado | Siguiente paso | Preparado hoy |
|---|---|---|---|---|---|
| 1 | Consulta al azar `ORDER BY RANDOM()` | ~50 000 frases (10× S-01) | Pausa perceptible al pedir frase | Elegir un desplazamiento aleatorio con `LIMIT 1 OFFSET ?` o mantener un contador | Sí: la consulta vive solo en el adaptador SQLite; cambiarla no toca nada más |
| 2 | Búsqueda por prefijo con `LIKE` | ~50 000 frases | Búsqueda lenta al teclear | Índice FTS5 de SQLite (búsqueda de texto completo) | Sí: es una migración que añade una tabla virtual |
| 3 | Un solo dispositivo | El día que se quiera un segundo | No hay forma de ver las mismas frases | Fase 2: API en Python + adaptador HTTP + sincronización por `updated_at` | Sí: UUID en cliente (ADR-0005), interfaz del repositorio (ADR-0004), `updated_at` en todas las tablas |
| 4 | Un solo usuario | Publicación en tienda | Datos de otras personas | Fase 3: cuentas y `user_id` en el servidor; la app local no cambia | Parcialmente: el modelo local no lleva `user_id` a propósito; en el servidor se añade |
| 5 | Mapeo manual fila→objeto | ~30 consultas distintas | Errores repetitivos de tipografía | Introducir un ORM ligero dentro del adaptador | Sí: contenido en un solo componente |

## Fases de evolución

**Fase 1 (ahora)**: app local con SQLite. Aprender React Native y SQLite.

**Fase 2 (cuando haya un segundo dispositivo o ganas de backend)**: servidor en Python (FastAPI) con su propia base de datos y **autenticación OAuth2** (RF-11): la app inicia sesión con un proveedor externo (Google, GitHub) mediante Authorization Code + PKCE usando `expo-auth-session`, y el servidor valida el token y asocia los datos a un `user_id`. La base de datos **del servidor** se decide en su propio ADR llegado el momento: SQLite basta para un usuario; PostgreSQL es la elección natural si habrá varios usuarios (fase 3) o si el objetivo es aprenderlo. Esa elección no afecta a la app: el teléfono sigue con SQLite siempre, porque PostgreSQL es un programa servidor y no puede correr dentro de un teléfono. Lo que cambia entre "SQLite en servidor" y "PostgreSQL en servidor" queda encerrado en el código Python. La app conserva SQLite local y sincroniza: primero subida simple (el teléfono manda lo nuevo por `updated_at`), después bidireccional. Alojamiento: plan gratuito de Railway aceptando que el servidor duerma, porque la app sigue funcionando sin él. OAuth2 solo tiene sentido con servidor: una app puramente local no tiene a quién demostrarle quién eres.

**Fase 3 (publicación)**: EAS Build, tiendas, tema claro por defecto para nuevos usuarios si se prefiere. El modelo local sigue igual.

**Versión 3 o 4 (otros idiomas)**: portugués → español u otro par. Solo cambia la interfaz de agregar y practicar; las tablas ya llevan `lang` (ADR-0006).

## Riesgos abiertos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Pérdida del teléfono sin respaldo reciente | media | alto | RF-06 obligatorio en v1; recordatorio de exportar si han pasado más de 30 días (v2) |
| R-02 | Curva de aprendizaje de React Native frena el proyecto | alta | medio | Expo (ADR-0003); construir primero la pantalla Practicar completa antes de las demás |
| R-03 | Tentación de saltarse las capas "porque son tres pantallas" | alta | alto en fase 2 | Regla de verificación de NFR-07: cero SQL fuera de `src/data` |
| R-04 | Cambio de la regla de normalización (S-02) con datos guardados | baja | medio | Migración que recalcula `*_norm`; la función vive en un solo lugar |
| R-05 | Una librería elegida funciona solo en Android y bloquea el paso a iPhone | baja | alto | Usar solo paquetes oficiales de Expo o con soporte declarado para iOS; probar en un iPhone prestado con Expo Go antes de la v1 final |
| R-06 | Publicar en App Store exige cuenta de desarrollador de Apple (99 USD/año) | cierta si se publica | bajo | No aplica para uso propio: en iPhone se puede usar con Expo Go o con una compilación de desarrollo de EAS sin publicar |

## Deuda técnica aceptada a propósito

| Qué | Por qué se acepta | Cuándo se revisa |
|---|---|---|
| `ORDER BY RANDOM()` recorre toda la tabla | Instantáneo bajo S-01; la alternativa complica el código sin beneficio hoy | Punto de ruptura 1 |
| Idiomas como código de dos letras en columna, sin tabla `language` | Tres valores fijos que no cambian; la tabla se añade con una migración cuando el usuario gestione idiomas desde la app | Si se necesita añadir idiomas sin actualizar la app |
| Búsqueda con `LIKE '%term%'` sin índice | Instantánea bajo S-01; FTS5 se añade como tabla virtual cuando duela | Punto de ruptura 2 |
| Sin historial de intentos | No pedido en v1; añadirlo es una tabla nueva sin tocar las existentes | v2 |
| `updated_at` mantenido por la app y no por trigger | Menos magia que explicar al principio | Si se detectan olvidos |
