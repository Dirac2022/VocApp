# Diagramas de arquitectura · vocapp

Un solo archivo, un diagrama por sección, cada uno en un bloque `mermaid`. Es la única fuente de verdad de los diagramas: los demás documentos enlazan aquí por ancla y nunca copian un bloque.

Se ven renderizados en la vista previa de Markdown de VS Code (extensión *Markdown Preview Mermaid Support*) y en GitHub. Para comprobar que todos compilan antes de entregar:

```bash
.claude/skills/system-diagrams/scripts/validate_mermaid.sh docs/architecture/diagrams.md
```

---

## C1 Contexto

**Pregunta que responde:** ¿qué es vocapp y con quién habla?

Color: azul = persona · azul oscuro = el sistema · gris = externo · ámbar punteado = planificado (fase 2, no existe hoy).

```mermaid
flowchart TB
    usuario["👤 Dirac<br/>Practica vocabulario y mantiene su diccionario personal"]:::persona

    sistema["<b>vocapp</b><br/>App móvil que muestra frases en inglés al azar,<br/>corrige la traducción escrita y permite ampliar el diccionario"]:::sistema

    respaldo["Destino del respaldo<br/>Drive, correo u otra app del teléfono"]:::externo
    servidor["Servidor vocapp<br/>API en Python · fase 2"]:::planificado

    usuario -->|"practica, agrega frases y traducciones<br/>pantalla táctil"| sistema
    sistema -->|"exporta e importa respaldo<br/>archivo JSON"| respaldo
    sistema -.->|"sincroniza el diccionario<br/>HTTPS · fase 2"| servidor

    classDef persona fill:#1f6feb,stroke:#0d419d,color:#fff
    classDef sistema fill:#0d419d,stroke:#051d4d,color:#fff
    classDef externo fill:#6e7681,stroke:#484f58,color:#fff
    classDef planificado fill:#9e6a03,stroke:#7d4e00,color:#fff,stroke-dasharray:5 5
```

---

## C3 Componentes de la app

**Pregunta que responde:** ¿qué hay dentro de la app y en qué dirección dependen las piezas?

Las flechas continuas son dependencias de código. Las punteadas "implementa" muestran que un adaptador cumple el contrato del puerto. Ámbar punteado = fase 2, no se construye hoy. Este diagrama hace visible el principio D de SOLID: los casos de uso y el adaptador dependen ambos de la interfaz, nunca el caso de uso de SQLite.

```mermaid
flowchart TB
    subgraph app["Contenedor: app vocapp · React Native + Expo · TypeScript"]
        ui["Capa de presentación<br/>pantallas y componentes visuales"]:::comp
        casos["Casos de uso<br/>practicar, agregar frase, agregar traducción, buscar"]:::comp
        dominio["Modelo de dominio<br/>Frase, Traducción, normalizar y comparar respuestas"]:::comp
        puerto["Puerto: interfaz RepositorioDeFrases<br/>contrato con las operaciones de datos"]:::comp
        repoSqlite["Adaptador SQLite<br/>implementa el contrato con SQL"]:::comp
        repoHttp["Adaptador HTTP<br/>implementa el contrato contra la API · fase 2"]:::planificado
    end

    db[("SQLite<br/>archivo vocapp.db dentro del teléfono")]:::datos
    api["API vocapp en Python · fase 2"]:::planificado

    ui -->|"invoca"| casos
    casos -->|"aplica reglas de"| dominio
    casos -->|"depende del contrato, no de SQLite"| puerto
    repoSqlite -.->|"implementa"| puerto
    repoHttp -.->|"implementa"| puerto
    repoSqlite -->|"SQL"| db
    repoHttp -->|"HTTPS · JSON"| api

    classDef comp fill:#0d419d,stroke:#051d4d,color:#fff
    classDef datos fill:#238636,stroke:#196c2e,color:#fff
    classDef planificado fill:#9e6a03,stroke:#7d4e00,color:#fff,stroke-dasharray:5 5
```

---

## ER Modelo de datos

**Pregunta que responde:** ¿cómo se estructuran los datos en la versión 1?

SQLite no tiene tipo UUID ni fecha: ambos se guardan como TEXT. Los idiomas van como código ISO 639-1 de dos letras (`en`, `es`, `pt`) para que un futuro par portugués → español no exija cambiar tablas (ADR-0006). La regla "toda frase tiene al menos una traducción" la garantiza la app en una transacción; SQLite no puede declararla. `app_setting` no se relaciona con nada: guarda preferencias del dispositivo.

```mermaid
erDiagram
    PHRASE ||--|{ TRANSLATION : "tiene"

    PHRASE {
        text id PK "UUID v4 generado en la app"
        text lang "idioma de origen, ISO 639-1. v1: siempre en"
        text text "frase o palabra tal cual la escribió el usuario"
        text text_norm "normalizada; única junto con lang"
        text created_at "ISO 8601 en UTC"
        text updated_at "ISO 8601 en UTC"
    }

    TRANSLATION {
        text id PK "UUID v4 generado en la app"
        text phrase_id FK "ON DELETE CASCADE"
        text lang "idioma de destino, ISO 639-1. v1: siempre es"
        text text "traducción tal cual la escribió el usuario"
        text text_norm "normalizada; única junto con phrase_id y lang"
        text created_at "ISO 8601 en UTC"
    }

    APP_SETTING {
        text key PK "nombre del ajuste, p. ej. theme"
        text value "valor como texto, p. ej. system, light, dark"
        text updated_at "ISO 8601 en UTC"
    }
```

---

## Secuencia Practicar

**Pregunta que responde:** ¿en qué orden hablan las capas durante el flujo crítico "practicar"?

El bloque `alt` muestra caminos alternativos: el usuario responde directo, pide una pista, o se rinde y ve las traducciones (RF-14). Cada camino termina en Siguiente. El resultado tiene cuatro valores posibles (acierto, fallo, con pista, revelado), preparados para la tabla de intentos de la versión 2.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant P as Pantalla Practicar
    participant C as Caso de uso Practicar
    participant R as Repositorio SQLite
    participant DB as SQLite

    U->>P: abre la pantalla
    P->>C: pedir frase aleatoria
    C->>R: obtenerFraseAleatoria
    R->>DB: SELECT frase al azar - ORDER BY RANDOM LIMIT 1
    DB-->>R: una fila de phrase
    R->>DB: SELECT traducciones WHERE phrase_id = ?
    DB-->>R: filas de translation
    R-->>C: Frase con su lista de traducciones
    C-->>P: texto en idioma origen - traducciones quedan ocultas
    P-->>U: muestra la frase, un campo de texto y los botones Pista y Mostrar traducciones

    alt Responde directo
        U->>P: escribe su traducción y pulsa Comprobar
        P->>C: comprobar respuesta
        C->>C: normalizar respuesta y comparar con cada traducción
        C-->>P: correcto o incorrecto + traducciones válidas
    else Pide una pista
        U->>P: pulsa Pista
        P->>C: pedir pista
        C->>C: construir pista a partir de la traducción más corta - primera letra y guiones por letra
        C-->>P: pista, p. ej. p _ _ _ _
        P-->>U: muestra la pista y el campo sigue activo
        U->>P: escribe y pulsa Comprobar
        P->>C: comprobar respuesta - marcada como con pista
        C-->>P: resultado + traducciones válidas
    else Se rinde
        U->>P: pulsa Mostrar traducciones
        P->>C: revelar traducciones
        C-->>P: lista completa - marcada como revelada, no cuenta como acierto
    end

    P-->>U: muestra resultado y botón Siguiente
```
