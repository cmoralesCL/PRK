-- Elimina la restricción de validación existente si existe.
-- Usar IF EXISTS para evitar errores si se ejecuta varias veces.
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;

-- Vuelve a crear la restricción con la lista completa y actualizada de valores de frecuencia.
-- Esto asegura que tanto las frecuencias de calendario como los nuevos compromisos recurrentes sean válidos.
ALTER TABLE public.habit_tasks
ADD CONSTRAINT habit_tasks_frequency_check CHECK (
  frequency IN (
    'daily',                          -- Aparece cada día
    'specific_days',                  -- Aparece en días específicos de la semana
    'every_x_days',                   -- Aparece cada 'n' días
    'every_x_weeks_specific_day',     -- Aparece en un día específico de la semana cada 'n' semanas
    'every_x_months_specific_day',    -- Aparece en un día específico del mes cada 'n' meses
    'weekly',                         -- Compromiso acumulativo para la semana
    'monthly',                        -- Compromiso acumulativo para el mes
    'every_x_weeks_commitment',       -- Compromiso acumulativo que se reinicia cada 'n' semanas
    'every_x_months_commitment'       -- Compromiso acumulativo que se reinicia cada 'n' meses
  )
);
