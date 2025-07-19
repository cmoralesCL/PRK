-- supabase/schema.sql

-- Elimina las tablas antiguas si existen para empezar de cero
DROP TABLE IF EXISTS public.daily_progress_snapshots CASCADE;
DROP TABLE IF EXISTS public.progress_logs CASCADE;
DROP TABLE IF EXISTS public.habit_tasks CASCADE;
DROP TABLE IF EXISTS public.area_prks CASCADE;
DROP TABLE IF EXISTS public.life_prks CASCADE;

-- 1. Tabla life_prks (Visión de Vida)
CREATE TABLE public.life_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    archived BOOLEAN DEFAULT false
);

-- 2. Tabla area_prks (Áreas de Enfoque)
CREATE TABLE public.area_prks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    life_prk_id UUID REFERENCES public.life_prks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_value NUMERIC,
    current_value NUMERIC,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    archived BOOLEAN DEFAULT false
);

-- 3. Tabla habit_tasks (Hábitos y Tareas)
CREATE TABLE public.habit_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_prk_id UUID REFERENCES public.area_prks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('habit', 'project', 'task')),
    created_at TIMESTAMPTZ DEFAULT now(),
    archived BOOLEAN DEFAULT false,
    start_date DATE,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'specific_days')),
    frequency_days TEXT[],
    weight NUMERIC DEFAULT 1,
    due_date DATE,
    completion_date DATE,
    is_critical BOOLEAN DEFAULT false,
    measurement_type TEXT CHECK (measurement_type IN ('binary', 'quantitative', 'temporal')),
    measurement_goal JSONB
);

-- 4. Tabla progress_logs (Registro de Progreso)
CREATE TABLE public.progress_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    habit_task_id UUID REFERENCES public.habit_tasks(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    progress_value NUMERIC,
    completion_percentage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla daily_progress_snapshots (Resumen Diario - Opcional para analytics)
CREATE TABLE public.daily_progress_snapshots (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    snapshot_date DATE NOT NULL UNIQUE,
    progress NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
