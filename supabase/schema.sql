-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.area_prks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  life_prk_id uuid NOT NULL,
  title text NOT NULL,
  target_value integer NOT NULL DEFAULT 100,
  current_value integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false,
  CONSTRAINT area_prks_pkey PRIMARY KEY (id),
  CONSTRAINT area_prks_life_prk_id_fkey FOREIGN KEY (life_prk_id) REFERENCES public.life_prks(id)
);
CREATE TABLE public.daily_progress_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  progress_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_progress_snapshots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.emotional_pulses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pulse_date date NOT NULL,
  emotional_state_tag text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT emotional_pulses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.habit_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  area_prk_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['habit'::text, 'project'::text, 'task'::text])),
  start_date date NOT NULL DEFAULT now(),
  due_date date,
  completion_date date,
  frequency text CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'specific_days'::text, 'every_x_months_commitment'::text])),
  frequency_days ARRAY,
  weight integer NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 5),
  is_critical boolean NOT NULL DEFAULT false,
  measurement_type text CHECK (measurement_type = ANY (ARRAY['binary'::text, 'quantitative'::text, 'temporal'::text])),
  measurement_goal jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false,
  archived_at timestamp with time zone,
  frequency_unit text,
  frequency_interval integer,
  frequency_day_of_month integer,
  description text,
  CONSTRAINT habit_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT habit_tasks_area_prk_id_fkey FOREIGN KEY (area_prk_id) REFERENCES public.area_prks(id)
);
CREATE TABLE public.life_prks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false,
  CONSTRAINT life_prks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.progress_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  habit_task_id uuid NOT NULL,
  completion_date date NOT NULL,
  progress_value numeric,
  completion_percentage numeric NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT progress_logs_pkey PRIMARY KEY (id),
  CONSTRAINT progress_logs_habit_task_id_fkey FOREIGN KEY (habit_task_id) REFERENCES public.habit_tasks(id)
);