# Brújula de Resultados Personales (BRP)

Bienvenido a tu Brújula de Resultados Personales, un sistema diseñado para transformar tu visión de vida en resultados tangibles. Si alguna vez te has sentido ocupado pero no productivo, o has perdido de vista tus metas a largo plazo en el día a día, esta herramienta es para ti.

## La Filosofía: De la Actividad al Logro

En un mundo lleno de distracciones, es fácil confundir estar ocupado con estar avanzando. La filosofía de la BRP se inspira en sistemas como los OKR (Objectives and Key Results) para ayudarte a centrarte en lo que realmente importa.

El sistema se basa en una jerarquía simple pero poderosa:

1.  **PRK de Vida (Tu "Norte"):** Esta es tu gran visión, tu objetivo a largo plazo. No es algo que completas en una semana, sino la estrella que guía tus decisiones.
    *   *Ej: "Alcanzar la independencia financiera" o "Vivir una vida sana y enérgica".*

2.  **PRK de Área (Tu "Mapa"):** Estos son los resultados clave medibles que te indican que estás avanzando hacia tu visión. Son los componentes cuantificables de tu PRK de Vida.
    *   *Para "vida sana", un PRK de Área podría ser: "Mejorar mi salud cardiovascular".*

3.  **Hitos y Hábitos (Tu "Camino"):** Aquí es donde la visión se encuentra con la acción diaria.
    *   **Hitos (Acciones de Impacto):** Son tareas únicas y significativas que causan un avance tangible en un PRK de Área. No son "enviar un email", sino "correr mi primera maratón" o "lanzar mi sitio web". Son las grandes palancas que mueves.
    *   **Hábitos (Acciones Recurrentes):** Son las prácticas consistentes que construyen la base para el éxito a largo plazo.
        *   *Ej: "Meditar 10 minutos al día" o "Hacer ejercicio 3 veces por semana".*

El objetivo es pasar de estar simplemente "ocupado" a ser verdaderamente **efectivo**, asegurando que cada acción que tomas, por pequeña que sea, esté alineada con la persona que aspiras a ser.

### ¿Cómo se Mide el Progreso? (La Magia del Sistema)

La belleza de la BRP es que el progreso no es subjetivo, sino que se calcula automáticamente basándose en tus acciones. Así es como funciona:

*   **1. Nivel de Acción (Hitos y Hábitos):**
    *   Cada Hito o Hábito que tienes programado para un día se considera una "unidad de cumplimiento". A cada acción se le asigna un **"Nivel de Impacto" (peso) de 1 a 5**.
    *   Si marcas una acción como completada, su progreso para ese día es del **100%**. Si no, es del **0%**.

*   **2. Nivel de Área (PRK de Área):**
    *   El progreso de un PRK de Área en un día específico es el **promedio ponderado del progreso de todos sus Hitos y Hábitos activos para ese día**. Esto significa que las acciones con mayor impacto contribuyen más al resultado.
    *   *Ejemplo:* Si un PRK de Área tiene un hábito de impacto 5 (correr) y otro de impacto 2 (tomar vitaminas), completar solo la carrera tendrá un efecto mucho mayor en el progreso que completar solo las vitaminas.
    *   **Importante:** Si un PRK de Área no tiene ninguna acción programada para un día, se considera "Sin Medición" y no afecta a tus estadísticas.

*   **3. Nivel de Visión (PRK de Vida):**
    *   Tu progreso en la gran visión de vida es el **promedio del progreso de todos tus PRK de Área que tienen medición para ese día**.
    *   Esto te da una visión clara y diaria de cuán alineadas están tus acciones con tus metas más importantes.

Este sistema de cálculo en cascada y ponderado asegura que cada acción se refleje de manera justa y precisa en tu avance hacia la vida que quieres construir.

## Descripción Técnica del Proyecto

Esta sección describe el estado técnico actual de la aplicación para contextualizar a desarrolladores o IAs colaboradoras.

*   **Stack Tecnológico:**
    *   **Framework:** Next.js (con App Router).
    *   **Lenguaje:** TypeScript.
    *   **UI:** React, ShadCN UI, Tailwind CSS.
    *   **Estado y Lógica del Cliente:** React Hooks. La gestión del estado es local en los componentes, y la lógica de negocio se centraliza en `actions` y `queries` del servidor.
    *   **Backend/Base de Datos:** Supabase (utilizando `supabase-ssr` para la comunicación segura desde el servidor y el cliente).
    *   **IA (Generativa):** Genkit, con el modelo Gemini de Google, se utiliza para sugerir tareas y hábitos relevantes para un PRK de Área (`suggest-related-habits-tasks.ts`).

*   **Arquitectura de Datos y Lógica del Servidor:**
    *   **`src/lib/types.ts`:** Define las interfaces principales (`LifePrk`, `AreaPrk`, `HabitTask`). La interfaz `HabitTask` incluye un campo `weight` para la ponderación.
    *   **`src/app/server/queries.ts`:** Contiene la lógica de negocio principal. Funciones clave:
        *   `calculateProgressForDate`: Calcula el progreso ponderado en cascada para todos los niveles de la jerarquía.
        *   `isTaskActiveOnDate`: Determina si un Hito debe ser visible en un día determinado, gestionando su ciclo de vida (desde el inicio hasta un día después de su finalización o fecha de vencimiento).
        *   `getHabitTasksForDate`: Filtra y prepara las acciones que son relevantes para una fecha seleccionada.
        *   `getDashboardData`, `getCalendarData`, `getLifePrkProgressData`: Son los puntos de entrada de datos para las páginas principales, orquestando las llamadas a las funciones de cálculo y consulta.
    *   **`src/app/actions.ts`:** Expone las mutaciones de datos (CRUD) que los componentes de cliente pueden invocar. Se encarga de la comunicación con Supabase y de la revalidación de caché de Next.js (`revalidatePath`).

*   **Componentes Clave de la Interfaz:**
    *   **`src/components/dashboard.tsx`:** La vista principal. Es un componente de cliente que gestiona el estado de los diálogos y coordina las llamadas a las `actions` del servidor.
    *   **`src/components/progress-calendar.tsx`:** Una vista de calendario que muestra el progreso diario general y las tareas de cada día.
    *   **`src/components/progress-chart.tsx`:** Gráfico que visualiza la tendencia de progreso de los PRK de Vida a lo largo del tiempo.
    *   **Diálogos (`add-*-dialog.tsx`, `habit-task-dialog.tsx`):** Formularios modales (usando `react-hook-form` y `zod` para validación) para crear y editar los diferentes elementos del sistema, incluyendo el campo de "Nivel de Impacto".
