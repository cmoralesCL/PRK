
-- Primero, eliminamos la restricción antigua
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;

-- Luego, añadimos la nueva restricción actualizada que incluye los nuevos valores
ALTER TABLE public.habit_tasks
ADD CONSTRAINT habit_tasks_frequency_check CHECK (
  frequency IN (
    'daily',
    'specific_days',
    'every_x_days',
    'every_x_weeks',
    'every_x_months',
    'weekly',
    'monthly'
  )
);
