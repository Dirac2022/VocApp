# ADR-0003 · Expo como herramienta de construcción de la app React Native

- **Estado**: Aceptado
- **Fecha**: 2026-09-21
- **Decide**: Dirac (propietario del proyecto)
- **Consultado**: Claude
- **Relacionado**: NFR-03 (una persona aprendiendo desde cero), NFR-09 (multiplataforma desde Linux), ADR-0002 (usa `expo-sqlite`)

## Contexto

React Native se puede usar de dos formas. Con la **CLI de React Native ("bare")** el proyecto incluye las carpetas nativas de Android (Java/Kotlin, Gradle) e iOS (Swift, Xcode) y se compila localmente: en Linux exige instalar Android Studio y el SDK, y compilar para iOS es imposible sin un Mac. Con **Expo**, un conjunto de herramientas construido encima de React Native, esas carpetas nativas se generan automáticamente, la app se prueba en el teléfono real con la aplicación Expo Go escaneando un código QR, y las compilaciones para tienda se hacen en la nube de Expo (EAS Build) sin Mac.

El desarrollador trabaja en Linux (Ubuntu), no sabe React Native, y hoy usa Android, pero quiere que la misma app funcione en un iPhone futuro sin reescribirla (NFR-09). Desde Linux no se puede compilar para iOS localmente: Apple solo permite hacerlo desde macOS con Xcode. La app usa SQLite, para lo que Expo ofrece el paquete oficial `expo-sqlite`.

## Opciones consideradas

### A · Expo (flujo gestionado, con Expo Go para desarrollo)
- A favor: instalación en minutos; probar en el teléfono sin compilar nada; funciona igual para Android e iPhone; documentación oficial de React Native recomienda empezar así; `expo-sqlite`, `expo-file-system` y `expo-sharing` cubren base de datos y respaldo; se puede "expulsar" al flujo bare más adelante si hace falta.
- En contra: algunas librerías nativas de terceros no funcionan en Expo Go (exigen una compilación de desarrollo); una capa más de conceptos propios de Expo.
- Coste: casi nulo.

### B · React Native CLI (bare)
- A favor: control total sobre el código nativo; sin capas intermedias.
- En contra: instalar Android Studio, SDK, emulador y configurar Gradle antes de ver una pantalla; imposible probar iOS desde Linux; cada dependencia nativa exige tocar configuración Android/iOS.
- Coste: uno o dos días de configuración inicial y fricción constante para alguien que empieza.

## Decisión

**Usaremos Expo con el flujo gestionado y probaremos en el teléfono real con Expo Go.**

**Criterio decisorio**: tiempo hasta la primera pantalla funcionando en el teléfono. Con Expo son minutos; con la CLI, horas o días, y ese tiempo no enseña nada de React Native. Segundo criterio, decisivo por sí solo: sin Mac, Expo es la única de las dos opciones que permite probar y compilar para iPhone (NFR-09).

## Consecuencias

### Positivas
- El primer día ya se ve la app en el teléfono.
- Independencia del sistema operativo del teléfono y del PC.
- Publicar en tiendas más adelante se hace con EAS Build sin cambiar de herramienta.

### Negativas
- Si en fase 2 se necesita una librería nativa no compatible con Expo Go, habrá que pasar a una compilación de desarrollo (`expo-dev-client`). Es un paso documentado, no un bloqueo.
- Expo añade vocabulario propio (Expo Go, EAS, config plugins) al que ya hay que aprender.

### A vigilar
- Versión del SDK de Expo: se actualiza cada pocos meses y conviene fijarla al crear el proyecto.

## Cuándo revisar esta decisión

Revisar si aparece una dependencia nativa imprescindible que Expo no soporte ni siquiera con compilación de desarrollo, o si el tamaño de la app o el tiempo de arranque, medidos, se vuelven un problema. Ambas cosas son improbables para esta app.
