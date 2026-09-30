# ADR-0007 · Expo Router para la navegación entre pantallas

- **Estado**: Aceptado
- **Fecha**: 2026-09-29
- **Decide**: Dirac
- **Consultado**: Claude
- **Relacionado**: ADR-0003 (Expo como toolchain), RF-11 (OAuth2 en fase 2), NFR-03 (una persona aprendiendo)

## Contexto

La app tiene hoy una sola pantalla dibujada directamente por `App.tsx`. Los requisitos de la versión 1 exigen al menos cuatro: practicar, agregar frase, buscar y agregar traducción, y ajustes. Hace falta un navegador.

El archivo `AGENTS.md` que trajo la plantilla de Expo indica usar Expo Router, con las rutas en `src/app` y el resto del código fuera de esa carpeta. La documentación oficial de Expo dice lo mismo.

Un dato verificado que cambia el planteamiento clásico: hasta la versión 6, `expo-router` dependía de `@react-navigation/native`, `native-stack` y `bottom-tabs`, de modo que era una capa sobre React Navigation. La versión que corresponde al SDK 57, la 57.0.23, **ya no depende de ningún paquete de React Navigation**: usa su propio motor, `standard-navigation`, sobre `react-native-screens`. Las dos opciones han dejado de ser capas una de otra y son alternativas reales.

En la fase 2 se quiere aprender OAuth2 (RF-11). El flujo *Authorization Code + PKCE* termina cuando el navegador del sistema devuelve el control a la app mediante una dirección propia del tipo `vocapp://...`, es decir, un enlace profundo.

## Opciones consideradas

### A · Navegación a mano con estado de React
- A favor: cero dependencias nuevas.
- En contra: sin botón físico de volver en Android, sin gestos, sin animaciones nativas, sin enlaces profundos, sin historial. No se usa en producción y no enseña nada transferible.
- Coste: bajo hoy, inasumible en cuanto haya tres pantallas.

### B · React Navigation directamente
- A favor: la librería con más años y más presencia; es el vocabulario de la mayoría de tutoriales, libros y respuestas en internet; funciona también fuera de Expo; declarar los navegadores en código hace el modelo explícito.
- En contra: los enlaces profundos requieren configuración manual; contradice el `AGENTS.md` del propio proyecto; más código repetitivo.
- Coste: medio.

### C · Expo Router
- A favor: enlaces profundos automáticos en toda pantalla; rutas verificadas por TypeScript, de modo que un enlace a una ruta inexistente no compila; la estructura de archivos documenta la navegación sin un archivo aparte que mantener; es el camino que Expo mantiene y recomienda.
- En contra: la mayoría del material de aprendizaje disponible habla de React Navigation; su motor de navegación es reciente, lo que implica menos respuestas en internet y más cambios entre versiones; ata el proyecto a Expo.
- Coste: bajo.

## Decisión

**Usaremos Expo Router, con las rutas en `src/app` y el resto del código en carpetas hermanas.**

**Criterio decisorio**: los enlaces profundos automáticos. Son un requisito técnico concreto de RF-11 en la fase 2, no una preferencia, y la opción B solo los ofrece añadiendo configuración manual. Que el `AGENTS.md` del proyecto y la documentación de Expo apunten en la misma dirección refuerza la elección pero no es lo que la decide.

## Consecuencias

### Positivas
- Cada pantalla es alcanzable por un enlace sin trabajo adicional, lo que deja el camino abierto a OAuth2.
- Las rutas mal escritas se detectan al compilar, no al ejecutar.
- El árbol de archivos es el mapa de navegación: no hay un registro de rutas que pueda quedar desincronizado.

### Negativas
- Al buscar ayuda en internet, la mayoría de las respuestas usarán la sintaxis de React Navigation y habrá que traducirlas.
- El motor de navegación es nuevo; cabe esperar cambios incompatibles entre versiones del SDK.
- Salir del ecosistema Expo obligaría a reescribir la navegación.

### A vigilar
- El esfuerzo de actualización al subir de versión del SDK.

## Cuándo revisar esta decisión

Revisar si se cumple cualquiera de estas condiciones observables:

1. El proyecto abandona Expo y pasa a React Native puro.
2. Actualizar `expo-router` entre versiones del SDK cuesta más de un día de trabajo.
3. Aparece un patrón de navegación necesario que Expo Router no soporte.