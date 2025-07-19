-- --- Esquema Inicial de la Base de Datos para Brújula de Resultados Personales ---

-- Eliminar tablas existentes en orden inverso de dependencia para una recreación limpia
DROP TABLE IF EXISTS public.daily_progress_snapshots;
DROP TABLE IF EXISTS public.progress_logs;
DROP TABLE IF EXISTS public.habit_tasks;
DROP TABLE IF EXISTS public.area_prks;
DROP TABLE IF EXISTS public.life_prks;

-- Tabla 1: Life PRKs (PRK de Vida)
-- Almacena las grandes visiones o metas a largo plazo.
CREATE TABLE public.life_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL
);
COMMENT ON TABLE public.life_prks IS 'Grandes visiones o metas a largo plazo.';

-- Tabla 2: Area PRKs (PRK de Área)
-- Almacena los resultados clave medibles que contribuyen a un PRK de Vida.
CREATE TABLE public.area_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    life_prk_id UUID REFERENCES public.life_prks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_value INTEGER DEFAULT 100 NOT NULL, -- Mantenido por si se usa en el futuro
    current_value INTEGER DEFAULT 0 NOT NULL, -- Mantenido por si se usa en el futuro
    unit TEXT DEFAULT '%' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL
);
COMMENT ON TABLE public.area_prks IS 'Resultados clave medibles para un PRK de Vida.';

-- Tabla 3: Habit Tasks (Hábitos y Tareas)
-- Almacena las acciones concretas (hábitos, proyectos, tareas) asociadas a un PRK de Área.
CREATE TABLE public.habit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_prk_id UUID REFERENCES public.area_prks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('habit', 'project', 'task')),
    start_date DATE DEFAULT now() NOT NULL,
    due_date DATE,
    completion_date DATE,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'specific_days')),
    frequency_days TEXT[], -- Array de strings, ej: ['mon', 'wed', 'fri']
    weight INTEGER DEFAULT 1 NOT NULL CHECK (weight >= 1 AND weight <= 5),
    is_critical BOOLEAN DEFAULT false NOT NULL,
    measurement_type TEXT CHECK (measurement_type IN ('binary', 'quantitative', 'temporal')),
    measurement_goal JSONB, -- { "target": 10, "unit": "pages" }
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL
);
COMMENT ON TABLE public.habit_tasks IS 'Acciones específicas (hábitos, proyectos, tareas).';

-- Tabla 4: Progress Logs (Registros de Progreso)
-- Registra cada vez que se completa una tarea o hábito.
CREATE TABLE public.progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_task_id UUID REFERENCES public.habit_tasks(id) ON DELETE CASCADE NOT NULL,
    completion_date DATE NOT NULL,
    progress_value NUMERIC, -- Para mediciones cuantitativas (ej: 10 páginas leídas)
    completion_percentage NUMERIC DEFAULT 1.0 NOT NULL, -- 1.0 para completado, < 1.0 para parcial
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.progress_logs IS 'Log de completado para cada acción.';
-- Índice para acelerar las consultas por fecha y tarea
CREATE INDEX idx_progress_logs_completion_date ON public.progress_logs(completion_date);
CREATE INDEX idx_progress_logs_habit_task_id ON public.progress_logs(habit_task_id);


-- Tabla 5: Daily Progress Snapshots (Resumen de Progreso Diario)
-- Almacena el progreso calculado para cada día. Podría ser calculado por un trigger o una función.
CREATE TABLE public.daily_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    progress_data JSONB, -- { "life_prk_id": {"progress": 75, "area_prks": [...]}, ... }
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(snapshot_date)
);
COMMENT ON TABLE public.daily_progress_snapshots IS 'Almacena el resumen del progreso diario total.';

-- --- Fin del Esquema ---
