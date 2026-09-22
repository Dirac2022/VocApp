# Arquitectura · vocapp

> **Alcance**: personal (un solo usuario), diseñado para evolucionar
> **Estado**: aprobado
> **Última revisión**: 2026-09-21 · **Responsable**: Dirac

## 1. Resumen ejecutivo

vocapp es una app móvil para que Dirac practique vocabulario en inglés: la app muestra una frase al azar, él escribe la traducción al español y la app la corrige aceptando cualquiera de las traducciones registradas. Él mismo alimenta el diccionario agregando frases y traducciones alternativas.

La decisión arquitectónica central es que **en la versión 1 no hay servidor**: la app es un monolito que corre entero en el teléfono con SQLite como base de datos. Funciona sin internet, cuesta cero y concentra el esfuerzo de aprendizaje en React Native y SQLite. Para que el proyecto pueda crecer después (segundo dispositivo, publicación), la app se organiza en capas con el acceso a datos detrás de una interfaz, y usa identificadores UUID generados en el teléfono. Así, añadir un servidor en Python en fase 2 es escribir un adaptador nuevo, no reescribir la app.

## 2. Diagrama de contexto

Ver [C1 Contexto](diagrams.md#c1-contexto).

- **Dirac**: único actor. Practica y mantiene su diccionario.
- **vocapp**: el sistema.
- **Destino del respaldo**: cualquier app del teléfono que reciba un archivo (Drive, correo). Externo.
- **Servidor vocapp**: planificado para fase 2, no existe hoy.

## 3. Decisión central

**Monolito en el teléfono, en capas, con SQLite local y sin servidor.**

Porque:
- NFR-01: debe funcionar sin internet.
- NFR-02: costo de infraestructura cero.
- NFR-03: una sola persona aprendiendo React Native; un segundo proyecto (servidor) dividiría el esfuerzo.

Alternativa principal descartada: cliente-servidor con API en Python en Railway/Vercel desde el día uno. Duplica el trabajo para resolver un problema (varios dispositivos) que todavía no existe, y los planes gratuitos duermen el servidor. Ver `decisions/ADR-0001`.

## 4. Vista de contenedores

Hay un solo contenedor desplegable, la app, así que no se dibuja C2. En su lugar se dibuja el interior de la app (C3), que es donde está la decisión importante: [C3 Componentes de la app](diagrams.md#c3-componentes-de-la-app).

| Componente | Responsabilidad | Tecnología | Cambia en fase 2 |
|---|---|---|---|
| Presentación | Pantallas | React Native + Expo, TypeScript | No |
| Casos de uso | Una función por acción del usuario | TypeScript | No |
| Dominio | Tipos, normalización, comparación | TypeScript puro | No |
| Puertos `PhraseRepository` y `SettingsRepository` | Contratos de acceso a datos | Interfaces TypeScript | No |
| Adaptador SQLite | SQL y migraciones | `expo-sqlite` | Se le suma un adaptador HTTP |
| Base de datos | Tablas `phrase`, `translation` y `app_setting` | SQLite, archivo `vocapp.db` | Sigue como caché local |

## 5. Modelo de datos

Ver [ER Modelo de datos](diagrams.md#er-modelo-de-datos). Tres tablas: `phrase` (1) tiene `translation` (muchos), ambas con código de idioma para soportar otros pares en el futuro sin cambiar el esquema (ADR-0006); `app_setting` guarda preferencias como el tema. Detalle en `02-dominio.md`.

## 6. Flujos críticos

| Flujo | Diagrama | Latencia objetivo |
|---|---|---|
| Practicar | [Secuencia Practicar](diagrams.md#secuencia-practicar) | < 100 ms percibidos (NFR-08) |

## 7. Índice de documentos

- [`01-requisitos.md`](01-requisitos.md) — funcionales, no funcionales y supuestos
- [`02-dominio.md`](02-dominio.md) — glosario, entidades, relaciones, restricciones
- [`03-arquitectura.md`](03-arquitectura.md) — componentes, flujos, contrato del respaldo
- [`04-riesgos-evolucion.md`](04-riesgos-evolucion.md) — puntos de ruptura y fases 2 y 3
- [`05-solid-en-vocapp.md`](05-solid-en-vocapp.md) — los cinco principios SOLID mapeados a piezas concretas del diseño
- [`diagrams.md`](diagrams.md) — todos los diagramas Mermaid, un bloque por sección
- [`decisions/`](decisions/README.md) — seis ADRs, todos en estado Propuesto

## 8. Lo que este diseño NO cubre

- Servidor, API, sincronización o varios dispositivos (fase 2, camino documentado).
- Inicio de sesión con OAuth2 (fase 2, junto con el servidor).
- Publicación en tiendas (fase 3).
- Estadísticas y repaso espaciado (v2/v3, sobre el mismo modelo).
- Otros pares de idiomas en la interfaz (v3/v4; el esquema ya está preparado).
- Audio, pronunciación, imágenes.

## Aprobación

Al aprobar este documento, los seis ADRs pasan a **Aceptado** y se puede empezar a escribir código. Hasta entonces, no se escribe código de la app.
