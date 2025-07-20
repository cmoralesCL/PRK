-- Primero, eliminamos la restricción antigua por si existe.
-- Usamos IF EXISTS para evitar un error si ya fue borrada.
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;

-- Luego, añadimos la nueva restricción actualizada con TODAS las opciones posibles.
ALTER TABLE public.habit_tasks
ADD CONSTRAINT habit_tasks_frequency_check CHECK (
  frequency IN (
    'daily',
    'specific_days',
    'every_x_days',
    'every_x_weeks_specific_day',
    'every_x_months_specific_day',
    'weekly',
    'monthly',
    'every_x_weeks_commitment',
    'every_x_months_commitment'
  )
);
