# ADR-0004 · Arquitectura en capas dentro de la app con patrón repositorio

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac (propietario del proyecto)
- **Consultado**: Claude
- **Relacionado**: ADR-0001, NFR-07 (evolucionabilidad), objetivo de aprendizaje 2 (proyectos escalables)

## Contexto

La app es un monolito que corre entero en el teléfono (ADR-0001). El objetivo de aprendizaje 2 es construir proyectos que puedan crecer: en concreto, poder añadir un servidor en fase 2 sin reescribir las pantallas.

En un proyecto pequeño la tentación es que cada pantalla haga su propio SQL. Es lo más rápido el primer día y lo más caro el día que la fuente de datos cambia: hay que tocar todas las pantallas.

## Opciones consideradas

### A · Pantallas que hablan directamente con SQLite
- A favor: menos archivos, menos conceptos, funciona.
- En contra: la lógica de negocio (normalizar, comparar respuestas) se duplica entre pantallas; cambiar SQLite por una API exige reescribir cada pantalla; imposible probar la lógica sin una base de datos.
- Coste: mínimo hoy, máximo en fase 2.

### B · Capas: presentación → casos de uso → dominio, con acceso a datos detrás de una interfaz (repositorio)
- A favor: las pantallas solo conocen los casos de uso; los casos de uso solo conocen la **interfaz** del repositorio (un contrato TypeScript que dice qué operaciones existen, no cómo se implementan); el adaptador SQLite es la única pieza con SQL; en fase 2 se añade un adaptador HTTP que cumple el mismo contrato y las pantallas no se enteran; la lógica de dominio se prueba sin base de datos.
- En contra: más archivos y carpetas; conceptos nuevos (interfaz, inyección de dependencias) que hay que aprender al principio; parece exagerado para tres pantallas.
- Coste: una tarde extra al inicio.

### C · Librería de estado remoto (React Query, Redux) desde el inicio
- A favor: patrones conocidos en la industria.
- En contra: resuelven problemas de datos remotos que en la versión 1 no existen; añaden mucho vocabulario nuevo encima de React Native.
- Coste: alto en aprendizaje, sin beneficio hoy.

## Decisión

**Organizaremos la app en capas: presentación, casos de uso, dominio y acceso a datos, con el acceso a datos detrás de una interfaz `PhraseRepository` cuya única implementación en la versión 1 será el adaptador SQLite.**

**Criterio decisorio**: es la decisión que hace real el objetivo "escalable a futuro" con el menor coste. Todo lo demás que suena a escalabilidad (servidores, colas, microservicios) es prematuro; esta separación no lo es, porque cuesta una tarde y ahorra una reescritura.

## Consecuencias

### Positivas
- Añadir el servidor en fase 2 es escribir un adaptador nuevo, no tocar pantallas.
- La lógica de negocio se puede probar con pruebas unitarias sin teléfono ni base de datos.
- Se aprenden conceptos transferibles a cualquier lenguaje: interfaz, dependencia, adaptador.

### Negativas
- Más archivos para tres pantallas. Habrá momentos en que parezca burocracia.
- Requiere disciplina: una sola línea de SQL en una pantalla rompe la promesa.

### A vigilar
- Que la dirección de dependencias se respete: presentación → casos de uso → dominio; el adaptador depende de la interfaz, nunca al revés. El diagrama C3 en `../diagrams.md` lo hace visible.

## Cuándo revisar esta decisión

Revisar si la app supera aproximadamente 15 pantallas y la organización por capas técnicas se vuelve difícil de navegar; en ese caso el siguiente paso es agrupar por funcionalidad (carpeta `practicar/`, carpeta `diccionario/`), manteniendo las mismas capas dentro de cada una.
