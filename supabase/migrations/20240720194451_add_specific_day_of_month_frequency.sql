-- Añade la nueva columna para guardar el día del mes
ALTER TABLE public.habit_tasks
ADD COLUMN IF NOT EXISTS frequency_day_of_month INTEGER;

-- Elimina la restricción de frecuencia antigua para poder añadir la nueva
-- El uso de IF EXISTS previene un error si la restricción ya fue borrada
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;

-- Vuelve a crear la restricción incluyendo la nueva opción 'specific_day_of_month'
-- y todas las demás opciones válidas para evitar futuros errores.
ALTER TABLE public.habit_tasks
ADD CONSTRAINT habit_tasks_frequency_check CHECK (
  frequency IN (
    'daily',
    'specific_days',
    'every_x_days',
    'every_x_weeks_specific_day',
    'every_x_months_specific_day',
    'specific_day_of_month',  -- Nueva opción
    'weekly',
    'monthly',
    'every_x_weeks_commitment',
    'every_x_months_commitment'
  )
);
