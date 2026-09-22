# ADR-0006 · Código de idioma en frases y traducciones desde la versión 1

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac
- **Consultado**: Claude
- **Relacionado**: ADR-0002, ADR-0005, RF-13, S-03

## Contexto

En la versión 1 solo hay un par de idiomas: inglés → español. El usuario quiere, en una versión 3 o 4 sin fecha, practicar también portugués → español, y pide que el modelo de datos esté preparado.

La clave de unicidad de una frase es hoy su texto normalizado. Con dos idiomas de origen, "dog" podría ser a la vez una palabra inglesa y, hipotéticamente, un texto en otro idioma: la unicidad pasa a ser (idioma, texto). Cambiar una clave de unicidad en SQLite con datos existentes exige, si se declaró dentro de la tabla, recrear la tabla completa copiando los datos; si se declaró como índice separado, basta con borrar y crear el índice.

## Opciones consideradas

### A · No añadir nada hoy; migrar cuando llegue el portugués
- A favor: modelo mínimo; ni una columna de más.
- En contra: la migración futura toca la clave de unicidad y las consultas de duplicados; con años de datos dentro es la clase de cambio que da miedo hacer.
- Coste: cero hoy, medio-alto después.

### B · Columna `lang` de dos letras en `phrase` y en `translation`, con valor fijo `en` y `es` en v1
- A favor: la unicidad ya es (lang, text_norm); añadir portugués no cambia ninguna tabla, solo la interfaz; el código ISO 639-1 es estándar y legible; cuesta dos columnas y dos `CHECK`.
- En contra: dos columnas que durante años tendrán un solo valor; una pregunta más que responder al agregar frase, aunque en v1 se rellene sola.
- Coste: casi nulo.

### C · Tabla `language` de referencia con clave foránea desde el día uno
- A favor: modelo "de libro"; permite guardar nombre del idioma y orden.
- En contra: una tabla más, datos semilla en la migración, un JOIN más, para una lista de tres valores que no cambia.
- Coste: bajo pero sin beneficio hasta que el usuario gestione idiomas desde la app.

## Decisión

**Añadiremos la columna `lang` (código ISO 639-1, `CHECK (length(lang) = 2)`) a `phrase` (idioma de origen) y a `translation` (idioma de destino) desde la primera migración, y declararemos las restricciones de unicidad como índices con nombre, no dentro de la tabla.**

**Criterio decisorio**: asimetría de coste. Dos columnas hoy cuestan minutos; la misma migración con datos dentro cuesta una tarde con riesgo. Es exactamente el tipo de decisión que este proyecto quiere enseñar.

## Consecuencias

### Positivas
- Portugués → español, o cualquier otro par, es un cambio de interfaz, no de esquema.
- Practicar puede filtrar por idioma cuando haya más de uno.
- El respaldo JSON lleva el idioma desde v1, así que un respaldo viejo se importa en cualquier versión futura.

### Negativas
- Columnas con un único valor durante mucho tiempo.
- La lista de idiomas válidos vive en código TypeScript, no en la base de datos: añadir uno exige una versión nueva de la app. Aceptado hasta que haga falta lo contrario.

### A vigilar
- Que toda consulta que compruebe duplicados incluya `lang`, no solo `text_norm`.

## Cuándo revisar esta decisión

Revisar si el usuario necesita añadir o renombrar idiomas desde la propia app sin actualizarla; entonces se crea la tabla `language` (opción C) con una migración que solo añade.
