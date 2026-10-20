# ADR-0008 · Los comandos pasan por un caso de uso; las consultas sin reglas usan el puerto

- **Estado**: Aceptado
- **Fecha**: 2026-10-19
- **Decide**: Dirac
- **Consultado**: Claude
- **Relacionado**: ADR-0004 (arquitectura en capas con repositorio), NFR-07

## Contexto

El ADR-0004 fijó la cadena de dependencias `presentación → casos de uso → dominio`, con los casos de uso apoyados en el puerto `PhraseRepository`.

Al construir la pantalla del diccionario apareció un caso que la regla no previó: listar las frases no tiene ninguna lógica. Un caso de uso para eso sería `return repository.listAll()`, una función que no valida, no decide y no combina nada. El propio ADR-0004 ya anticipó como consecuencia negativa que en partes pequeñas la separación "parecería burocracia".

Las escrituras son distintas. Agregar una frase valida entradas, detecta duplicados y distingue tres desenlaces; esa lógica no puede vivir en una pantalla porque habría que repetirla en cuanto exista otra forma de agregar frases, como la importación de un respaldo (RF-06).

Las escrituras son distintas. Agregar una frase valida entradas, detecta duplicados y distingue tres desenlaces; esa lógica no puede vivir en una pantalla porque habría que repetirla en cuanto exista otra forma de agregar frases, como la importación de un respaldo (RF-06).

Los dos objetivos que persigue la regla son que la interfaz no dependa de detalles de almacenamiento y que las reglas de negocio no se escondan en las pantallas. Una consulta directa al puerto no incumple ninguno: el hook depende de la interfaz, no del adaptador, y no hay regla que esconder.

Los dos objetivos que persigue la regla son que la interfaz no dependa de detalles de almacenamiento y que las reglas de negocio no se escondan en las pantallas. Una consulta directa al puerto no incumple ninguno: el hook depende de la interfaz, no del adaptador, y no hay regla que esconder.

## Opciones consideradas

### A · Caso de uso para todo, incluidas las consultas triviales
- A favor: una sola regla sin excepciones, fácil de verificar.
- En contra: funciones que solo reenvían la llamada; más archivos y más pruebas sin contenido; el coste se paga en cada pantalla nueva.
- Coste: permanente y creciente.

### B · Comandos por caso de uso, consultas sin reglas directas al puerto
- A favor: la separación se paga donde aporta; menos código muerto; la distinción entre leer y escribir es conocida y fácil de explicar.
- En contra: la regla tiene un matiz, y un matiz puede degenerar si alguien mete lógica en una consulta.
- Coste: bajo.

### C · Acceso directo al puerto también para escrituras
- A favor: el mínimo de código.
- En contra: las reglas de negocio acabarían repartidas por las pantallas; la importación de respaldos tendría que duplicarlas.
- Coste: alto en cuanto haya una segunda vía de escritura.

## Decisión

**Las escrituras y cualquier operación con reglas pasan por un caso de uso. Las consultas que solo leen y no deciden nada pueden llamar al puerto `PhraseRepository` directamente desde un hook.**

**Criterio decisorio**: dónde está la lógica. La capa de casos de uso existe para albergar reglas; una función sin reglas no tiene nada que albergar.

## Consecuencias

### Positivas
- `useDictionary` y el futuro hook de búsqueda quedan en dos líneas, sin intermediarios vacíos.
- La capa de casos de uso contiene solo archivos con contenido real, lo que la hace fácil de leer.

### Negativas
- La regla ya no es "todo pasa por casos de uso", y eso exige criterio al añadir código.
- Si una consulta adquiere reglas, hay que acordarse de moverla a un caso de uso.

### A vigilar
- Que ninguna llamada de escritura al repositorio aparezca fuera de `src/usecases`.
- Que ninguna consulta desde un hook incluya decisiones de negocio: si aparece un `if` sobre el contenido de los datos, es señal de que debe mudarse.

## Cuándo revisar esta decisión

Revisar si aparece una consulta con reglas que alguien resuelva dentro de un hook, o si el número de llamadas directas al puerto desde la interfaz hace difícil saber quién accede a los datos.