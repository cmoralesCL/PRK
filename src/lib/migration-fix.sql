-- Elimina la restricción que impedía asignar frecuencias a las tareas.
-- Esto permite que tanto 'task' como 'habit' puedan tener una frecuencia.
ALTER TABLE public.habit_tasks
DROP CONSTRAINT IF EXISTS habit_tasks_frequency_check;