# Prompt Técnico para el Desarrollo de "Cenit"

## 1. Visión General y Filosofía de la Aplicación

**Nombre del Proyecto:** Cenit - Tu Ecosistema de Potencial

**Objetivo Principal:** Es un sistema de productividad personal diseñado para ayudar a los usuarios a alinear sus acciones diarias con sus metas y visiones de vida a largo plazo. La filosofía se basa en transformar la "actividad" sin rumbo en "logros" con propósito, utilizando una jerarquía clara y medible.

**Jerarquía de Datos (Modelo de Dominio):**
La aplicación se estructura en tres niveles anidados que conectan la visión a largo plazo con las acciones diarias:

1.  **Órbita (Orbit/LifePrk):** El nivel más alto. Representa un pilar de vida o un área perpetua de enfoque. No se "completa", sino que guía la dirección general. *Ej: "Salud y Bienestar", "Carrera Profesional".*
2.  **Fase (Phase/AreaPrk):** El nivel intermedio. Representa un proyecto finito o una meta medible dentro de una Órbita. Es un resultado clave que indica progreso. *Ej: "Mejorar mi resistencia cardiovascular" dentro de la Órbita "Salud y Bienestar".*
3.  **Pulso (Pulse/HabitTask):** El nivel más bajo y la unidad de acción. Representa las tareas y hábitos específicos que impulsan el progreso de una o más Fases.
    *   **Tipo Tarea:** Una acción única o que se repite en fechas específicas.
    *   **Tipo Hábito:** Una acción recurrente destinada a formar una costumbre.

## 2. Stack Tecnológico y Arquitectura

La aplicación está construida con un stack moderno basado en TypeScript y Next.js.

*   **Framework Frontend:** **Next.js 14+** con **App Router**.
*   **Lenguaje:** **TypeScript**.
*   **UI Framework:** **React** con Componentes Funcionales y Hooks.
*   **Estilos:** **Tailwind CSS** para el diseño de utilidad.
*   **Sistema de Componentes:** **ShadCN UI**. La mayoría de los componentes de UI (botones, tarjetas, diálogos, etc.) provienen de esta librería.
*   **Base de Datos y Backend:** **Supabase**. Se utiliza para la autenticación y como base de datos PostgreSQL.
    *   **Acceso a Datos:** Se utiliza el paquete `@supabase/ssr` para crear clientes de Supabase tanto en Componentes de Servidor como de Cliente de forma segura.
*   **Lógica de Servidor (Server Actions):** Toda la lógica de mutación de datos (CRUD) se encuentra en **`src/app/actions.ts`** y se expone a través de Server Actions de Next.js.
*   **Lógica de Consulta (Queries):** Toda la lógica de lectura y cálculo de datos complejos reside en **`src/app/server/queries.ts`**. Estas funciones son llamadas desde las páginas (Server Components) para obtener los datos necesarios.
*   **Gestión de Fechas:** **`date-fns`** es la librería utilizada para toda la manipulación de fechas.
*   **IA Generativa:** **Genkit** (específicamente `@genkit-ai/googleai`) para funcionalidades de IA, como la sugerencia de tareas.

## 3. Lógica de Negocio Clave

### 3.1. Cálculo de Progreso (Weighted Cascading Progress)

El núcleo del sistema es su motor de cálculo de progreso, que opera en cascada y de forma ponderada.

*   **Nivel Pulso:**
    *   Cada Pulso tiene un `weight` (Nivel de Impacto) de 1 a 5.
    *   El progreso de un Pulso binario en un día es 100% si está completado (`completedToday = true`) y 0% si no.
    *   El progreso de un Pulso cuantitativo se calcula como `(current_progress_value / target_count)`.
*   **Nivel Fase:**
    *   El progreso de una Fase en un día es el **promedio ponderado** del progreso de todos sus Pulsos activos para ese día.
    *   Fórmula: `∑(progreso_pulso * peso_pulso) / ∑(peso_pulso)`.
    *   Si una Fase no tiene Pulsos activos en un día, su progreso es `null` (Sin Medición) y no se cuenta en el nivel superior.
*   **Nivel Órbita:**
    *   El progreso de una Órbita en un día es el **promedio simple** del progreso de todas sus Fases con medición activa para ese día.

Esta lógica se encuentra centralizada en la función `calculateProgressForDate` en `src/app/server/queries.ts`.

### 3.2. Motor de Frecuencias y Actividad de Tareas

Una lógica crucial es determinar si un "Pulso" está activo en una fecha determinada. La función `isTaskActiveOnDate` en `src/app/server/queries.ts` implementa estas reglas, basadas en el campo `frequency` del Pulso.

*   **Pulsos con Fecha Específica:** Son acciones que aparecen en el calendario en días concretos.
    *   `UNICA`: Tarea de una sola vez.
    *   `DIARIA`: Todos los días a partir de `start_date`.
    *   `SEMANAL_DIAS_FIJOS`: Se repite en días fijos de la semana (ej. L, M, V).
    *   `INTERVALO_...`: Se repite cada N días, semanas o meses.
*   **Compromisos por Período:** Son metas flexibles que no tienen un día fijo y aparecen en vistas especiales (como la barra lateral de compromisos).
    *   `SEMANAL_ACUMULATIVO`: Debe completarse X veces por semana.
    *   `MENSUAL_ACUMULATIVO`: Debe completarse X veces por mes.
    *   Y otras variantes trimestrales, anuales y recurrentes.

## 4. Estructura de Archivos Clave

*   **`src/app/(app)/`**: Contiene las rutas y páginas principales de la aplicación (day, calendar, panel, etc.).
*   **`src/components/`**: Ubicación de todos los componentes React.
    *   **`ui/`**: Componentes base de ShadCN UI.
    *   Componentes de aplicación (ej. `panel.tsx`, `life-prk-section.tsx`).
*   **`src/lib/`**:
    *   **`types.ts`**: Define las interfaces TypeScript principales (`Orbit`, `Phase`, `Pulse`). Es la fuente de verdad para la estructura de datos.
    *   **`supabase/`**: Configuraciones para crear los clientes de Supabase (cliente, servidor, middleware).
*   **`src/app/actions.ts`**: Server Actions para todas las operaciones de escritura (CRUD).
*   **`src/app/server/queries.ts`**: Funciones del lado del servidor para todas las operaciones de lectura y cálculos complejos.
*   **`src/middleware.ts`**: Middleware de Next.js para gestionar la sesión de autenticación de Supabase en cada solicitud.
*   **`src/ai/`**: Lógica relacionada con Genkit para funcionalidades de IA.