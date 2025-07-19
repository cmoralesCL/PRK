-- supabase/schema.sql

-- --- Borrado de Tablas Existentes (para empezar de cero) ---
-- Se eliminan en orden inverso a su creación para respetar las dependencias.
DROP TABLE IF EXISTS public.daily_progress_snapshots;
DROP TABLE IF EXISTS public.progress_logs;
DROP TABLE IF EXISTS public.habit_tasks;
DROP TABLE IF EXISTS public.area_prks;
DROP TABLE IF EXISTS public.life_prks;


-- --- Creación de Tablas ---

-- Tabla 1: life_prks (Visión de Vida)
CREATE TABLE public.life_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.life_prks IS 'Almacena las visiones de vida a largo plazo del usuario (ej: "Salud y Energía").';


-- Tabla 2: area_prks (Áreas de Enfoque)
CREATE TABLE public.area_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    life_prk_id UUID NOT NULL REFERENCES public.life_prks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    unit TEXT,
    target_value INTEGER NOT NULL DEFAULT 100,
    current_value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.area_prks IS 'Resultados medibles que contribuyen a un PRK de Vida (ej: "Mejorar salud cardiovascular").';


-- Tabla 3: habit_tasks (Acciones: Hábitos, Tareas, Proyectos)
CREATE TABLE public.habit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_prk_id UUID NOT NULL REFERENCES public.area_prks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('habit', 'project', 'task')),
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'specific_days')),
    frequency_days TEXT[],
    weight INTEGER NOT NULL DEFAULT 1,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    measurement_type TEXT CHECK (measurement_type IN ('binary', 'quantitative', 'temporal')),
    measurement_goal JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.habit_tasks IS 'Acciones específicas (hábitos, tareas, proyectos) ligadas a un PRK de Área.';


-- Tabla 4: progress_logs (Registros de Progreso)
CREATE TABLE public.progress_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    habit_task_id UUID NOT NULL REFERENCES public.habit_tasks(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    progress_value NUMERIC,
    completion_percentage NUMERIC CHECK (completion_percentage >= 0 AND completion_percentage <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.progress_logs IS 'Registra cada vez que un hábito o tarea es completado.';


-- Tabla 5: daily_progress_snapshots (Resúmenes de Progreso Diario)
CREATE TABLE public.daily_progress_snapshots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    snapshot_date DATE NOT NULL UNIQUE,
    progress NUMERIC NOT NULL CHECK (progress >= 0 AND progress <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.daily_progress_snapshots IS 'Almacena el progreso ponderado total para cada día.';


-- --- Índices para Mejorar Rendimiento ---
CREATE INDEX idx_area_prks_life_prk_id ON public.area_prks(life_prk_id);
CREATE INDEX idx_habit_tasks_area_prk_id ON public.habit_tasks(area_prk_id);
CREATE INDEX idx_progress_logs_habit_task_id ON public.progress_logs(habit_task_id);
CREATE INDEX idx_progress_logs_completion_date ON public.progress_logs(completion_date);
CREATE INDEX idx_daily_progress_snapshots_snapshot_date ON public.daily_progress_snapshots(snapshot_date);

