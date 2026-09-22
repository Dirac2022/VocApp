# Requisitos

## Contexto y objetivo

Dirac quiere mejorar su vocabulario en inglés practicando traducción escrita. Hoy no tiene una herramienta propia donde acumular las frases y palabras que va encontrando, ni una forma de que le pregunten al azar y le corrijan aceptando más de una respuesta válida.

El proyecto tiene un segundo objetivo, tan importante como el primero: **aprender React Native, SQLite y a estructurar proyectos que puedan crecer**.

## Actores

| Actor | Descripción | Volumen estimado |
|---|---|---|
| Usuario (Dirac) | Único usuario. Practica y mantiene su diccionario personal | 1 persona, sesiones de 5 a 20 minutos |

## Requisitos funcionales

| ID | Como... | quiero... | para... | Prioridad |
|---|---|---|---|---|
| RF-01 | usuario | que al abrir "Practicar" aparezca una frase o palabra en inglés al azar, escribir mi traducción y saber si es correcta viendo todas las traducciones válidas | ejercitar vocabulario | must |
| RF-02 | usuario | agregar una frase en inglés junto con al menos una traducción al español | ampliar mi diccionario | must |
| RF-03 | usuario | encontrar una frase existente escribiendo solo una parte que recuerde (de la frase o de una de sus traducciones), viendo sugerencias mientras tecleo, y agregarle otra traducción | aceptar sinónimos sin tener que recordar la frase entera | must |
| RF-04 | usuario | que la app detecte que una frase ya existe aunque la escriba con mayúsculas o espacios distintos | no duplicar entradas | must |
| RF-05 | usuario | que la comparación de mi respuesta ignore mayúsculas, acentos, espacios sobrantes y puntuación final | que "El perro" y "el perro." cuenten como iguales | must |
| RF-06 | usuario | exportar todo mi diccionario a un archivo JSON y volver a importarlo | no perder datos si cambio o pierdo el teléfono | must |
| RF-07 | usuario | ver la lista de mis frases con sus traducciones y poder editar o borrar | corregir errores | should |
| RF-08 | usuario | ver cuántas veces acerté y fallé cada frase | saber qué repasar | could (v2) |
| RF-09 | usuario | que las frases que fallo aparezcan más a menudo (repaso espaciado) | practicar mejor | could (v3) |
| RF-10 | usuario | usar la app desde varios dispositivos con los datos sincronizados | practicar desde el PC | fuera de alcance v1, camino documentado en `04-riesgos-evolucion.md` |
| RF-11 | usuario | iniciar sesión con una cuenta (Google u otro proveedor) mediante OAuth2 | proteger mis datos en el servidor y aprender OAuth2 | v2, junto con el servidor |
| RF-12 | usuario | elegir tema claro, oscuro o "seguir al sistema", y que la elección se recuerde | comodidad visual propia y de futuros usuarios | must |
| RF-13 | usuario | agregar y practicar frases de otro idioma de origen, como portugués → español | ampliar a otros idiomas | v3 o v4; el modelo de datos ya lo soporta (ADR-0006) |
| RF-14 | usuario | al practicar, pedir una pista (primera letra y longitud de una traducción) o mostrar todas las traducciones cuando no la sé, sin que eso cuente como acierto | no atascarme y aprender igual | must |

## Requisitos no funcionales

### NFR-01 · Funciona sin internet
- **Requisito**: todas las funciones must operan sin conexión.
- **Origen**: entrevista (solo teléfono, práctica en cualquier lugar).
- **Impacto arquitectónico**: los datos deben vivir en el teléfono (ADR-0001).
- **Verificación**: activar modo avión y completar RF-01 a RF-06.

### NFR-02 · Costo de infraestructura: cero
- **Requisito**: 0 USD al mes.
- **Origen**: entrevista.
- **Impacto arquitectónico**: sin servidor en v1 (ADR-0001).
- **Verificación**: no existe ninguna cuenta de pago asociada al proyecto.

### NFR-03 · Una sola persona, aprendiendo React Native desde cero
- **Requisito**: cada pieza del stack debe poder explicarse línea por línea; se prefiere la herramienta conocida o la más simple a la óptima.
- **Origen**: entrevista. Conocimientos actuales: Python básico, SQL básico, algo de PostgreSQL. Nada de JavaScript/TypeScript, React Native ni SQLite.
- **Impacto arquitectónico**: Expo en lugar de CLI bare (ADR-0003); SQL a mano en lugar de ORM (ADR-0002); sin librerías de estado avanzadas (ADR-0004).
- **Verificación**: el usuario puede explicar qué hace cada archivo del proyecto.

### NFR-04 · Respaldo que se sabe restaurar
- **Requisito**: exportar e importar el diccionario completo (RF-06). La importación se prueba de verdad en un teléfono o instalación limpia antes de dar la v1 por terminada.
- **Origen**: skill de arquitectura, regla "un backup no probado no es un backup".
- **Impacto arquitectónico**: formato JSON versionado con número de esquema.
- **Verificación**: exportar, borrar la app, reinstalar, importar, comprobar que están todas las frases.

### NFR-05 · Migraciones de esquema versionadas
- **Requisito**: ningún cambio de tabla se hace a mano; cada cambio es un script numerado que la app aplica al arrancar.
- **Origen**: skill de arquitectura.
- **Impacto arquitectónico**: ejecutor de migraciones con `PRAGMA user_version` (ADR-0002).
- **Verificación**: instalar la versión N, agregar datos, actualizar a N+1, los datos siguen.

### NFR-06 · Secretos fuera del repositorio
- **Requisito**: `.env` y credenciales en `.gitignore` desde el primer commit. En v1 no hay secretos; la regla queda establecida para fase 2.
- **Origen**: skill de arquitectura.
- **Verificación**: `git log --all -- .env` no devuelve nada.

### NFR-07 · Evolucionable hacia cliente-servidor sin reescribir pantallas
- **Requisito**: ninguna pantalla contiene SQL ni conoce SQLite. El acceso a datos pasa por una interfaz.
- **Origen**: objetivo de aprendizaje 2 (proyectos escalables).
- **Impacto arquitectónico**: capas y patrón repositorio (ADR-0004); UUID y marcas de tiempo (ADR-0005).
- **Verificación**: buscar `SELECT` o `expo-sqlite` en la carpeta de pantallas devuelve cero resultados.

### NFR-08 · Respuesta inmediata
- **Requisito**: mostrar una frase nueva o comprobar una respuesta tarda menos de 100 ms percibidos.
- **Origen**: supuesto razonable para una app local.
- **Impacto arquitectónico**: ninguno hoy; con S-01 vigente, `ORDER BY RANDOM()` sobre miles de filas es instantáneo.
- **Verificación**: uso manual; sin retrasos perceptibles.

### NFR-09 · Multiplataforma: la misma app en Android y iPhone
- **Requisito**: un único código base que funcione en Android hoy y en iPhone cuando el usuario cambie de teléfono, sin reescribir nada. El PC de desarrollo es Linux (Ubuntu), sin acceso a un Mac.
- **Origen**: entrevista (2026-09-21).
- **Impacto arquitectónico**: refuerza ADR-0003. React Native ya es multiplataforma por diseño; Expo añade lo que Linux no puede hacer solo: probar en iPhone con Expo Go sin compilar, y compilar para iOS en la nube (EAS Build) sin Mac. Evitar librerías que solo existan para Android.
- **Verificación**: la app abre y pasa RF-01 a RF-06 en Expo Go tanto en Android como en un iPhone prestado. La migración de datos entre teléfonos se hace con el respaldo JSON (RF-06).

## Supuestos

| ID | Supuesto | Valor | Base | Decisión que invalida si es falso |
|---|---|---|---|---|
| S-01 | Volumen máximo del diccionario | ≤ 5 000 frases, ≤ 20 000 traducciones en 2 años | Una persona agregando unas pocas al día | Elección de frase al azar con `ORDER BY RANDOM()` (recorre toda la tabla); habría que cambiar a selección por índice aleatorio |
| S-02 | Regla de comparación de respuestas | Insensible a mayúsculas, acentos, espacios múltiples y puntuación final; sensible a las palabras | El objetivo es vocabulario inglés, no ortografía española | La función `normalize` y las columnas `*_norm`; cambiarla exige recalcular esas columnas con una migración |
| S-03 | Idiomas en v1 | Solo inglés → español, aunque las tablas ya llevan columna `lang` (ADR-0006) | Entrevista; portugués → español previsto para v3 o v4 | Nada estructural. Si aparece antes de lo previsto, solo cambia la interfaz de agregar y practicar |
| S-04 | Dirección de práctica | Se muestra la frase en idioma de origen, se escribe en idioma de destino | Entrevista | Nada estructural: la práctica inversa usa las mismas tablas |
| S-05 | Sistema operativo del teléfono | Android hoy; iPhone en un futuro lejano | Confirmado por el usuario el 2026-09-21 | Ninguna: React Native y Expo cubren ambos. Ver NFR-09 |

## Fuera de alcance de la versión 1

- Cuentas de usuario e inicio de sesión con OAuth2 (v2, junto con el servidor).
- Servidor, API, sincronización entre dispositivos (fase 2, ver `04-riesgos-evolucion.md`).
- Publicación en tiendas (fase 3).
- Otros pares de idiomas en la interfaz (v3 o v4; el esquema ya está preparado).
- Audio, pronunciación, imágenes.
- Estadísticas y repaso espaciado (v2 y v3, sobre el mismo modelo de datos).
