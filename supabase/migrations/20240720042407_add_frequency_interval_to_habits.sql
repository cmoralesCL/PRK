-- supabase/migrations/20240720042407_add_frequency_interval_to_habits.sql

ALTER TABLE public.habit_tasks
ADD COLUMN frequency_unit TEXT,
ADD COLUMN frequency_interval INTEGER;
