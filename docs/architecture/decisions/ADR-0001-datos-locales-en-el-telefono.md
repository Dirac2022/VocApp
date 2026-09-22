# ADR-0001 · Los datos viven en el teléfono, sin servidor, en la versión 1

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac (propietario del proyecto)
- **Consultado**: Claude (asesoría de arquitectura)
- **Relacionado**: NFR-01 (sin internet), NFR-02 (costo cero), NFR-03 (una persona aprendiendo), NFR-07 (evolucionabilidad), ADR-0004

## Contexto

vocapp es una app personal de un solo usuario que se usará únicamente desde un teléfono durante la versión 1. El objetivo de aprendizaje número uno es React Native; el segundo es aprender a construir proyectos que puedan escalar después; el tercero es SQLite.

El presupuesto mensual de infraestructura es cero. Las opciones gratuitas de alojamiento consideradas (Railway, Vercel y similares) apagan el servidor tras minutos de inactividad y pueden cambiar sus condiciones sin aviso.

Existe el deseo, a futuro, de publicar la app en una tienda y de poder usarla desde más de un dispositivo. Ese futuro no tiene fecha.

## Opciones consideradas

### A · Todo en el teléfono (local-first)
- A favor: funciona sin internet; costo cero; un solo proyecto que programar; toda la energía de aprendizaje va a React Native y SQLite; nada que mantener encendido.
- En contra: los datos existen solo en ese teléfono; sin un respaldo exportable se pierden con el dispositivo; no hay práctica desde el PC.
- Coste: solo desarrollo de la app.

### B · Cliente y servidor desde el día uno (app + API en Python + base de datos en Railway/Vercel)
- A favor: datos fuera del teléfono; varios dispositivos; se aprende backend en Python.
- En contra: dos proyectos que programar y depurar a la vez, siendo la primera vez con React Native; se necesita internet para practicar; los planes gratuitos duermen el servidor y la primera petición del día tarda varios segundos; hay que diseñar autenticación aunque sea un solo usuario, porque la API queda expuesta en internet.
- Coste: aproximadamente el doble de desarrollo y una pieza operativa permanente.

### C · Híbrido desde el inicio (local + sincronización con servidor)
- A favor: lo mejor de ambos.
- En contra: la sincronización bidireccional es el problema más difícil de los tres y no aporta nada mientras haya un solo dispositivo.
- Coste: el más alto.

## Decisión

**Guardaremos los datos localmente en el teléfono, en SQLite, sin ningún servidor en la versión 1. El diseño interno de la app dejará preparado el camino hacia la opción C sin construirla todavía (ver ADR-0004 y ADR-0005).**

**Criterio decisorio**: el objetivo de aprendizaje prioritario es React Native, y hoy solo hay un dispositivo. Construir un servidor ahora duplicaría el esfuerzo para resolver un problema que todavía no existe.

## Consecuencias

### Positivas
- Se puede practicar en cualquier lugar, sin conexión.
- Cero costo mensual y cero operación.
- Un único código base, en un único lenguaje, durante la fase de aprendizaje.

### Negativas
- Los datos dependen de un solo teléfono. Por eso el respaldo exportable a JSON es requisito obligatorio de la versión 1 (RF-06), no un extra.
- No se aprende backend en Python en esta fase.

### A vigilar
- Que las pantallas nunca ejecuten SQL directamente. Si lo hacen, el camino hacia el servidor se cierra (ADR-0004).
- Que los identificadores sean generables en el teléfono y únicos globalmente (ADR-0005), o la sincronización futura chocará.

## Cuándo revisar esta decisión

Revisar cuando se cumpla cualquiera de estas condiciones observables:

1. Se quiere practicar desde un segundo dispositivo (PC o segundo teléfono).
2. Se decide publicar la app en una tienda para otras personas.
3. Se quiere empezar a aprender backend en Python con un proyecto real.

En cualquiera de los tres casos el paso natural es añadir la API en Python y un segundo adaptador del repositorio (fase 2 en los diagramas), no reescribir la app.
