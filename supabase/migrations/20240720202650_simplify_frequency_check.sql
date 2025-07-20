
-- Elimina la restricción existente para evitar conflictos.
-- Usamos IF EXISTS para que no falle si la restricción ya ha sido eliminada.
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;

-- Vuelve a crear la restricción con la lista de valores simplificada
-- que se corresponde con la nueva lógica del "Frequency Builder".
ALTER TABLE public.habit_tasks
ADD CONSTRAINT habit_tasks_frequency_check CHECK (
  frequency IN (
    'daily',
    'specific_days',
    'every_x_days',
    'every_x_weeks',
    'every_x_months',
    'specific_day_of_month',
    'weekly',
    'monthly'
  )
);
