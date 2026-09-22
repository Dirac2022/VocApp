# ADR-0002 · SQLite con SQL escrito a mano y migraciones versionadas

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac (propietario del proyecto)
- **Consultado**: Claude
- **Relacionado**: ADR-0001, NFR-05 (migraciones), objetivo de aprendizaje 3 (SQLite)

## Contexto

Decidido que los datos viven en el teléfono (ADR-0001), hay que elegir cómo se guardan. El modelo tiene dos entidades relacionadas (frase y traducción, 1 a muchos) y consultas por varios criterios: al azar, por texto, por frase. El volumen esperado es pequeño (supuesto S-01: menos de 5 000 frases).

El usuario sabe SQL básico, conoce algo de PostgreSQL y quiere aprender SQLite específicamente. Nunca ha usado un ORM en JavaScript.

El esquema va a cambiar con el tiempo (por ejemplo, añadir historial de intentos en la versión 2). Cambiar tablas que ya tienen datos dentro exige migraciones versionadas; el skill de arquitectura lo marca como algo que no se omite ni en proyectos personales.

## Opciones consideradas

### A · SQLite con SQL escrito a mano + migraciones propias versionadas con `PRAGMA user_version`
- A favor: se aprende SQL y SQLite de verdad, sin capa intermedia que oculte lo que pasa; SQLite es el motor nativo de Android e iOS; `expo-sqlite` es oficial y estable; `user_version` es un contador entero que SQLite guarda dentro del archivo, ideal para numerar migraciones sin dependencias.
- En contra: hay que escribir a mano la conversión entre filas y objetos; un error de SQL se detecta al ejecutar, no al compilar.
- Coste: unas decenas de líneas para el ejecutor de migraciones.

### B · SQLite a través de un ORM (Drizzle ORM sobre expo-sqlite)
- A favor: consultas verificadas por TypeScript en tiempo de compilación; generador de migraciones automático.
- En contra: oculta el SQL, que es justo lo que se quiere aprender; añade una herramienta, su configuración y sus errores propios a un aprendizaje que ya incluye React Native; su generador de migraciones para Expo requiere pasos adicionales de configuración.
- Coste: medio día de configuración inicial y una abstracción más que entender.

### C · Guardar todo como un JSON en AsyncStorage (almacén clave-valor del teléfono)
- A favor: lo más simple que existe; sin SQL.
- En contra: no se aprende SQLite; cada búsqueda recorre todo el JSON en memoria; sin transacciones ni restricciones de unicidad; escala mal y no prepara nada de cara al servidor futuro.
- Coste: casi nulo hoy, alto cuando haya que migrar.

## Decisión

**Usaremos SQLite mediante `expo-sqlite`, escribiendo el SQL a mano y numerando las migraciones con `PRAGMA user_version`.**

**Criterio decisorio**: el objetivo de aprendizaje. Un ORM es una buena herramienta cuando ya sabes qué SQL genera; antes de eso, esconde lo que se quiere entender.

## Consecuencias

### Positivas
- Cada consulta que la app hace es SQL visible y explicable línea por línea.
- Sin dependencias adicionales más allá de `expo-sqlite`.
- Las migraciones quedan como una lista ordenada de scripts SQL; el archivo de base de datos recuerda en qué número se quedó.

### Negativas
- El mapeo fila a objeto es manual y repetitivo.
- Un error de tipografía en una consulta se descubre al ejecutarla, no antes.
- El ejecutor de migraciones es código propio que hay que probar.

### A vigilar
- Que todas las escrituras que afectan a más de una tabla vayan en una transacción (por ejemplo, crear frase y su primera traducción).
- Que `PRAGMA foreign_keys = ON` se ejecute al abrir cada conexión: en SQLite las claves foráneas vienen desactivadas por defecto.

## Cuándo revisar esta decisión

Revisar si el número de consultas distintas supera aproximadamente 30 y el mapeo manual se vuelve la principal fuente de errores, o si el proyecto pasa a fase 2 y se quiere compartir tipos entre app y servidor. En ese punto, introducir Drizzle sobre el mismo esquema es un cambio contenido en el adaptador SQLite (ADR-0004).
