-- =============================================================================
-- SCRIPT DE SIMULACIÓN DE DATOS PARA PROGRESS_LOGS
-- =============================================================================
-- Este script genera un historial realista de cumplimiento de hábitos y tareas
-- para un usuario específico durante un período de tiempo determinado.
-- Simula una tasa de cumplimiento que mejora gradualmente con el tiempo.

-- INSTRUCCIONES:
-- 1. Copia TODO el contenido de este archivo.
-- 2. Pégalo en el SQL Editor de tu proyecto Supabase.
-- 3. Asegúrate de que el 'user_uuid' coincida con el ID del usuario para el que
--    quieres generar los datos.
-- 4. Ejecuta la consulta.

DO $$
DECLARE
    -- === CONFIGURACIÓN ===
    user_uuid UUID := '7de8c686-4712-4111-9f37-e5590d40a2b2';
    simulation_start_date DATE := '2024-01-01';
    simulation_end_date DATE := '2025-12-31';
    -- La tasa de cumplimiento inicial (ej. 0.4 = 40%)
    initial_compliance_rate REAL := 0.4;
    -- La tasa de cumplimiento máxima que se alcanzará al final del período
    final_compliance_rate REAL := 0.9;

    -- === VARIABLES INTERNAS ===
    current_date DATE;
    total_days INT;
    days_passed INT;
    current_compliance_rate REAL;
    task_record RECORD;
    num_to_complete INT;
    i INT;
    random_day_offset INT;
    completion_date DATE;
    progress_value_calc REAL;
BEGIN
    -- Limpiar registros existentes para este usuario para evitar duplicados
    RAISE NOTICE 'Limpiando registros de progreso existentes para el usuario %...', user_uuid;
    DELETE FROM public.progress_logs WHERE user_id = user_uuid;
    UPDATE public.habit_tasks SET completion_date = NULL WHERE user_id = user_uuid AND type = 'task';
    RAISE NOTICE 'Limpieza completada.';

    total_days := simulation_end_date - simulation_start_date;

    -- Bucle principal: recorre cada día del período de simulación
    FOR current_date IN SELECT generate_series(simulation_start_date, simulation_end_date, '1 day'::interval)::date LOOP
        days_passed := current_date - simulation_start_date;
        -- Calcula la tasa de cumplimiento para el día actual, que aumenta linealmente
        current_compliance_rate := initial_compliance_rate + (final_compliance_rate - initial_compliance_rate) * (days_passed::real / total_days::real);

        -- Bucle para cada hábito/tarea definido para el usuario
        FOR task_record IN SELECT * FROM public.habit_tasks WHERE user_id = user_uuid AND NOT archived LOOP
            -- Ignorar si la tarea no ha comenzado o ya tiene una fecha de finalización pasada
            IF current_date < task_record.start_date OR (task_record.due_date IS NOT NULL AND current_date > task_record.due_date) THEN
                CONTINUE;
            END IF;

            -- === LÓGICA POR TIPO DE FRECUENCIA ===

            -- 1. Tareas Diarias y de Días Fijos
            IF task_record.frequency = 'DIARIA' OR
               (task_record.frequency = 'SEMANAL_DIAS_FIJOS' AND to_char(current_date, 'DY') = ANY(string_to_array(btrim(array_to_string(task_record.frequency_days, ','), '[]'), ','))) OR
               (task_record.frequency = 'MENSUAL_DIA_FIJO' AND EXTRACT(DAY FROM current_date) = task_record.frequency_day_of_month)
            THEN
                IF random() < current_compliance_rate THEN
                    IF task_record.measurement_type = 'quantitative' THEN
                        progress_value_calc := (task_record.measurement_goal->>'target_count')::numeric * (0.8 + random() * 0.4);
                        INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage)
                        VALUES (user_uuid, task_record.id, current_date, progress_value_calc, progress_value_calc / (task_record.measurement_goal->>'target_count')::numeric)
                        ON CONFLICT (habit_task_id, completion_date) DO NOTHING;
                    ELSE
                        INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage)
                        VALUES (user_uuid, task_record.id, current_date, 1, 1.0)
                        ON CONFLICT (habit_task_id, completion_date) DO NOTHING;
                    END IF;
                END IF;
            END IF;

            -- 2. Tareas Acumulativas Semanales (se procesan al final de la semana, el domingo)
            IF task_record.frequency = 'SEMANAL_ACUMULATIVO' AND EXTRACT(DOW FROM current_date) = 0 THEN
                num_to_complete := round((task_record.measurement_goal->>'target_count')::numeric * current_compliance_rate);
                FOR i IN 1..num_to_complete LOOP
                    random_day_offset := floor(random() * 7);
                    completion_date := current_date - random_day_offset * '1 day'::interval;
                    
                    INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage)
                    VALUES (user_uuid, task_record.id, completion_date, 1, 1.0)
                    ON CONFLICT (habit_task_id, completion_date) DO NOTHING; -- Cláusula de conflicto para seguridad
                END LOOP;
            END IF;

            -- 3. Tareas Únicas (tipo 'task') - Marcado aleatorio de completado
            IF task_record.type = 'task' AND task_record.frequency IS NULL AND task_record.completion_date IS NULL THEN
                -- Probabilidad diaria baja de completar una tarea pendiente
                IF random() < 0.05 THEN
                    completion_date := current_date;
                    IF task_record.due_date IS NOT NULL AND completion_date > task_record.due_date THEN
                        completion_date := task_record.due_date - floor(random() * 3)::int * '1 day'::interval;
                    END IF;
                    
                    IF completion_date >= task_record.start_date THEN
                         UPDATE public.habit_tasks SET completion_date = completion_date WHERE id = task_record.id;
                         INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage)
                         VALUES (user_uuid, task_record.id, completion_date, 1, 1.0)
                         ON CONFLICT (habit_task_id, completion_date) DO NOTHING;
                    END IF;
                END IF;
            END IF;
            
        END LOOP; -- Fin del bucle de tareas
    END LOOP; -- Fin del bucle de días

    RAISE NOTICE 'Simulación de registros de progreso completada exitosamente.';
END $$;
