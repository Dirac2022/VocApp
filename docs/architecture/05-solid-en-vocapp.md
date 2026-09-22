# SOLID aplicado a vocapp

SOLID son cinco principios para organizar código de modo que cambiarlo no lo rompa. Nacieron en el mundo de las clases (programación orientada a objetos), pero se aplican igual a módulos, funciones e interfaces de TypeScript. Este documento los explica con las piezas de vocapp y señala, con honestidad, dónde **no** los aplicamos a propósito.

Una advertencia antes de empezar: SOLID no se aplica a cada función. Se aplica en las **fronteras** entre piezas que cambian por motivos distintos. Aplicarlo en todas partes produce una app de tres pantallas con cuarenta archivos que nadie entiende.

## S · Responsabilidad única (Single Responsibility)

**Enunciado**: una pieza debe tener una sola razón para cambiar.

**En vocapp**:
- La pantalla Practicar cambia si cambia el diseño visual. No cambia si cambia el SQL.
- El caso de uso `checkAnswer` cambia si cambia la regla de qué cuenta como acierto.
- El adaptador SQLite cambia si cambia el esquema o la consulta.
- La función `normalize` vive en un solo lugar del dominio. Si algún día los acentos deben importar (S-02), se toca una función.

**Cómo detectar que se rompe**: una pantalla con una línea de SQL tiene dos razones para cambiar. Ese es el test de NFR-07.

## O · Abierto / cerrado (Open/Closed)

**Enunciado**: una pieza debe poder **extenderse** sin **modificar** lo que ya funciona.

**En vocapp**:
- Añadir el adaptador HTTP en fase 2 no modifica ningún caso de uso: se añade un archivo nuevo que cumple el mismo contrato.
- Añadir un tema visual es añadir un objeto de colores; ningún componente cambia porque ninguno tiene colores literales.
- Añadir el idioma portugués no modifica tablas (ADR-0006): el esquema estaba abierto a extenderse.

**Dónde no lo aplicamos**: la lista de idiomas válidos está escrita en el código. Añadir uno modifica esa lista. Aceptado: tres valores fijos no justifican una tabla.

## L · Sustitución de Liskov (Liskov Substitution)

**Enunciado**: si una pieza espera un contrato, cualquier implementación de ese contrato debe poder sustituir a otra sin que la pieza lo note.

**En vocapp**:
- Los casos de uso esperan un `PhraseRepository`. El adaptador SQLite, el adaptador HTTP futuro y un adaptador en memoria para pruebas deben comportarse igual desde fuera: `getRandom` devuelve nulo si no hay frases, en las tres implementaciones. Si una devolviera un error y otra nulo, la sustitución fallaría.
- Por eso el contrato documenta no solo las firmas sino el **comportamiento**: qué pasa con diccionario vacío, qué pasa al insertar un duplicado.

**Beneficio inmediato**: probar los casos de uso con un repositorio en memoria, sin teléfono ni base de datos.

## I · Segregación de interfaces (Interface Segregation)

**Enunciado**: nadie debe depender de operaciones que no usa. Mejor varias interfaces pequeñas que una enorme.

**En vocapp**:
- `PhraseRepository` y `SettingsRepository` están separados. La pantalla de Ajustes depende del segundo y no sabe que existen frases. Cuando en fase 2 las frases se sincronicen y los ajustes no, la separación paga.

**Dónde no lo aplicamos**: `PhraseRepository` mezcla lectura y escritura en una sola interfaz. Separarlas (una interfaz para leer, otra para escribir) sería correcto y hoy es exagerado. Se revisa si algún componente necesita solo leer y aparece la tentación de darle acceso a todo.

## D · Inversión de dependencias (Dependency Inversion)

**Enunciado**: las piezas de alto nivel (reglas de negocio) no deben depender de las de bajo nivel (base de datos). Ambas deben depender de una **abstracción** (la interfaz).

**En vocapp**:
- El caso de uso depende de la interfaz `PhraseRepository`. El adaptador SQLite también depende de esa interfaz, porque la implementa. La flecha de dependencia apunta **hacia la interfaz** desde ambos lados. Nunca del caso de uso hacia SQLite. El diagrama [C3 Componentes de la app](diagrams.md#c3-componentes-de-la-app) lo muestra.
- La pieza concreta se "inyecta": al arrancar la app, un único archivo (llamado punto de composición o *composition root*) crea el adaptador SQLite y se lo pasa a los casos de uso como parámetro. Los casos de uso nunca escriben `new SQLiteRepository()`. Inyectar significa simplemente **recibir la dependencia desde fuera en vez de crearla dentro**.

**Es el principio que hace posible la fase 2**: el punto de composición cambia una línea, de adaptador SQLite a adaptador HTTP, y nada más se toca.

## Resumen: dónde vive cada principio

| Principio | Pieza de vocapp donde se ve | Documento |
|---|---|---|
| S | Capas separadas; `normalize` en un solo lugar | `03-arquitectura.md`, ADR-0004 |
| O | Adaptador HTTP como archivo nuevo; temas como objetos; columna `lang` | ADR-0004, ADR-0006 |
| L | Contrato con comportamiento definido; adaptador en memoria para pruebas | `03-arquitectura.md` |
| I | `PhraseRepository` y `SettingsRepository` separados | `03-arquitectura.md` |
| D | Casos de uso dependen de interfaces; punto de composición inyecta el adaptador | `diagrams.md` (C3), ADR-0004 |

## Lo que SOLID no resuelve aquí

- No dice dónde viven los datos (ADR-0001). Eso es arquitectura, no diseño de código.
- No dice qué SQL escribir. Eso es modelado de datos (`02-dominio.md`).
- No evita la sobreingeniería. Al contrario, mal aplicado la produce. La regla del proyecto: aplicarlo en las fronteras entre capas y en ningún otro sitio hasta que un cambio real duela.
