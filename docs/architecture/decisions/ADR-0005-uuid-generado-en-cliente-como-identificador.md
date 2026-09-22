# ADR-0005 · Identificadores UUID generados en el teléfono, con marcas de tiempo en UTC

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac (propietario del proyecto)
- **Consultado**: Claude
- **Relacionado**: ADR-0001, ADR-0002, NFR-07

## Contexto

Cada fila de las tablas `phrase` y `translation` necesita una clave primaria. SQLite ofrece por defecto `INTEGER PRIMARY KEY AUTOINCREMENT`: un contador que asigna 1, 2, 3... al insertar.

El plan de fase 2 (ADR-0001) es sincronizar el diccionario con un servidor y, quizá, con un segundo dispositivo. Si dos dispositivos generan cada uno su frase número 42 y luego sincronizan, hay colisión. Si el servidor tuviera que asignar los números, la app no podría crear frases sin conexión.

## Opciones consideradas

### A · Entero autoincremental de SQLite
- A favor: es el comportamiento por defecto; ocupa 8 bytes; ordenable; fácil de leer al depurar.
- En contra: solo es único dentro de un archivo de base de datos; dos teléfonos o teléfono y servidor colisionan; obliga a renumerar al sincronizar.
- Coste: cero hoy, alto en fase 2.

### B · UUID versión 4 generado en la app y guardado como TEXT
- A favor: único en el universo práctico sin coordinación con nadie; la app puede crear registros sin conexión y el servidor los acepta tal cual; es el estándar que las APIs exponen.
- En contra: 36 caracteres frente a 8 bytes (irrelevante para miles de filas); no ordenable por tiempo, por lo que hace falta `created_at` para ordenar.
- Coste: una librería pequeña para generarlos (`expo-crypto` incluye `randomUUID`).

## Decisión

**Usaremos UUID v4 generados en la app como clave primaria de tipo TEXT, y guardaremos `created_at` y `updated_at` como texto ISO 8601 en UTC en toda tabla.**

**Criterio decisorio**: la sincronización futura. Cambiar de enteros a UUID con datos ya guardados obliga a reescribir todas las claves foráneas; hacerlo desde el día uno es gratis.

## Consecuencias

### Positivas
- Fase 2 no exige renumerar nada: el servidor recibe los mismos identificadores que tiene el teléfono.
- `updated_at` permite en el futuro detectar qué cambió desde la última sincronización.

### Negativas
- Los identificadores son ilegibles al depurar a ojo.
- Hay que acordarse de rellenar `updated_at` en cada modificación; SQLite no lo hace solo (se puede añadir un trigger si se olvida con frecuencia).

### A vigilar
- Que la generación del UUID ocurra siempre en la capa de casos de uso o repositorio, nunca en la pantalla.

## Cuándo revisar esta decisión

Solo si se descarta definitivamente cualquier sincronización o publicación futura. Aun entonces, el coste de mantener UUID es despreciable, así que probablemente no merezca cambiarse.
