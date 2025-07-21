-- Clear existing data in reverse order of dependency to avoid foreign key constraints
DELETE FROM public.progress_logs;
DELETE FROM public.habit_tasks;
DELETE FROM public.area_prks;
DELETE FROM public.life_prks;

-- Reset sequences if you want to start IDs from 1 again (optional)
-- ALTER SEQUENCE life_prks_id_seq RESTART WITH 1;
-- ALTER SEQUENCE area_prks_id_seq RESTART WITH 1;
-- ALTER SEQUENCE habit_tasks_id_seq RESTART WITH 1;
-- ALTER SEQUENCE progress_logs_id_seq RESTART WITH 1;

-- Define Life PRKs in a Common Table Expression (CTE)
WITH life_prks_cte AS (
    INSERT INTO public.life_prks (title, description, archived) VALUES
    ('Salud y Energía Vital ⚡', 'Mantener un cuerpo sano, enérgico y resiliente.', false),
    ('Mente y Crecimiento Personal 🧠', 'Cultivar una mente aguda, curiosa y en constante aprendizaje.', false),
    ('Relaciones y Conexión Humana ❤️', 'Fomentar vínculos profundos y significativos con los demás.', false),
    ('Trabajo y Finanzas 📈', 'Alcanzar la excelencia profesional y la solidez financiera.', false),
    ('Propósito y Contribución ✨', 'Vivir una vida con sentido, pasión y un impacto positivo.', false)
    RETURNING id, title
),
-- Define Area PRKs
area_prks_cte AS (
    INSERT INTO public.area_prks (life_prk_id, title, description, unit, target_value, current_value, archived)
    SELECT
        lp.id,
        v.title,
        v.description,
        '%', 100, 0, false
    FROM life_prks_cte lp
    JOIN (VALUES
        -- Salud
        ('Salud y Energía Vital ⚡', 'Optimizar mi Nutrición y Composición Corporal', 'Comer de forma inteligente para mejorar mi físico y bienestar.'),
        ('Salud y Energía Vital ⚡', 'Mejorar mi Descanso y Recuperación', 'Dormir profundamente para maximizar la recuperación física y mental.'),
        ('Salud y Energía Vital ⚡', 'Incrementar mi Resistencia y Fuerza Física', 'Ser capaz de superar retos físicos con confianza.'),
        -- Mente
        ('Mente y Crecimiento Personal 🧠', 'Desarrollar el Hábito de la Lectura Profunda', 'Leer de forma consistente para adquirir nuevo conocimiento.'),
        ('Mente y Crecimiento Personal 🧠', 'Adquirir una Nueva Habilidad de Alto Valor', 'Aprender y dominar el Inglés de Negocios.'),
        ('Mente y Crecimiento Personal 🧠', 'Cultivar la Creatividad y la Curiosidad', 'Explorar nuevas ideas y hobbies para mantener una mente ágil.'),
        -- Relaciones
        ('Relaciones y Conexión Humana ❤️', 'Fortalecer el Vínculo con mi Pareja', 'Invertir tiempo y energía en mi relación más importante.'),
        ('Relaciones y Conexión Humana ❤️', 'Cultivar Amistades de Calidad', 'Mantener y fortalecer mis lazos de amistad.'),
        ('Relaciones y Conexión Humana ❤️', 'Ser un Pilar Presente para mi Familia', 'Estar disponible y conectado con mis seres queridos.'),
        -- Trabajo y Finanzas
        ('Trabajo y Finanzas 📈', 'Aumentar mi Enfoque y Productividad en el Trabajo', 'Trabajar de forma más inteligente y con menos distracciones.'),
        ('Trabajo y Finanzas 📈', 'Construir un Sistema Financiero Antifrágil', 'Tener control y seguridad sobre mis finanzas personales.'),
        ('Trabajo y Finanzas 📈', 'Generar una Nueva Fuente de Ingresos', 'Crear un proyecto secundario que genere valor e ingresos.'),
        -- Propósito
        ('Propósito y Contribución ✨', 'Desarrollar una Práctica de Mindfulness y Serenidad', 'Encontrar calma y claridad en el día a día.'),
        ('Propósito y Contribución ✨', 'Dedicar Tiempo a un Hobby Apasionante', 'Disfrutar de actividades que me llenen de energía y alegría.'),
        ('Propósito y Contribución ✨', 'Contribuir a mi Entorno y Comunidad', 'Dejar un impacto positivo, por pequeño que sea.')
    ) AS v(lp_title, title, description) ON lp.title = v.lp_title
    RETURNING id, title
)
-- Finally, insert Habit/Tasks
INSERT INTO public.habit_tasks (
    area_prk_id, title, description, type, weight, is_critical, start_date,
    frequency, measurement_type, measurement_goal, frequency_days, frequency_day_of_month, frequency_interval
)
SELECT
    ap.id,
    v.title,
    v.description,
    v.type::public.task_type,
    v.weight,
    v.is_critical,
    v.start_date,
    v.frequency::public.habit_frequency,
    v.measurement_type::public.measurement_type,
    v.measurement_goal,
    v.frequency_days,
    v.frequency_day_of_month,
    v.frequency_interval
FROM area_prks_cte ap
JOIN (VALUES
    -- Área 1.1: Nutrición
    ('Optimizar mi Nutrición y Composición Corporal', 'Beber 2.5 litros de agua al día', '', 'habit', 2, false, NOW(), 'DIARIA', 'quantitative', '{"target_count": 2500, "unit": "ml"}', NULL, NULL, NULL),
    ('Optimizar mi Nutrición y Composición Corporal', 'Consumir un mínimo de 4 porciones de vegetales diariamente', '', 'habit', 3, false, NOW(), 'DIARIA', 'quantitative', '{"target_count": 4, "unit": "porciones"}', NULL, NULL, NULL),
    ('Optimizar mi Nutrición y Composición Corporal', 'No consumir alimentos procesados', '', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['L','M','X','J','V'], NULL, NULL),
    ('Optimizar mi Nutrición y Composición Corporal', 'Realizar una consulta con un nutricionista', 'Plan personalizado.', 'task', 5, true, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 1.2: Descanso
    ('Mejorar mi Descanso y Recuperación', 'Acostarme y levantarme a la misma hora', 'Incluso fines de semana.', 'habit', 5, true, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Mejorar mi Descanso y Recuperación', 'No usar pantallas 60 mins antes de dormir', '', 'habit', 4, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Mejorar mi Descanso y Recuperación', 'Leer 10 páginas de ficción antes de dormir', '', 'habit', 3, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Mejorar mi Descanso y Recuperación', 'Comprar e instalar cortinas blackout', '', 'task', 4, false, NOW(), 'MENSUAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),

    -- Área 1.3: Resistencia y Fuerza
    ('Incrementar mi Resistencia y Fuerza Física', 'Correr 3 veces por semana', '', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['L','X','V'], NULL, NULL),
    ('Incrementar mi Resistencia y Fuerza Física', 'Realizar 2 sesiones de entrenamiento de fuerza', '', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['M','J'], NULL, NULL),
    ('Incrementar mi Resistencia y Fuerza Física', 'Inscribirme y completar una carrera de 10K', 'Objetivo del semestre.', 'task', 5, true, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),
    ('Incrementar mi Resistencia y Fuerza Física', 'Alcanzar meta de levantar mi peso en sentadillas', '', 'task', 5, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 2.1: Lectura
    ('Desarrollar el Hábito de la Lectura Profunda', 'Leer 30 mins de no-ficción cada mañana', '', 'habit', 4, true, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Desarrollar el Hábito de la Lectura Profunda', 'Escuchar audiolibro/podcast educativo', 'Durante traslados.', 'habit', 2, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['L','M','X','J','V'], NULL, NULL),
    ('Desarrollar el Hábito de la Lectura Profunda', 'Terminar 12 libros este año', '', 'task', 5, true, NOW(), 'ANUAL_ACUMULATIVO', 'quantitative', '{"target_count": 12, "unit": "libros"}', NULL, NULL, NULL),
    ('Desarrollar el Hábito de la Lectura Profunda', 'Escribir resumen de una página por libro', '', 'habit', 3, false, NOW(), 'MENSUAL_DIA_FIJO', 'binary', NULL, NULL, 28, NULL),

    -- Área 2.2: Nueva Habilidad
    ('Adquirir una Nueva Habilidad de Alto Valor', 'Completar 3 lecciones en app de idiomas por semana', '', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', 'quantitative', '{"target_count": 3, "unit": "lecciones"}', NULL, NULL, NULL),
    ('Adquirir una Nueva Habilidad de Alto Valor', 'Ver serie/película en inglés', 'Con subtítulos en inglés.', 'habit', 2, false, NOW(), 'SEMANAL_ACUMULATIVO', 'quantitative', '{"target_count": 2, "unit": "veces"}', NULL, NULL, NULL),
    ('Adquirir una Nueva Habilidad de Alto Valor', 'Practicar conversación 30 mins semanales', '', 'habit', 4, true, NOW(), 'SEMANAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Adquirir una Nueva Habilidad de Alto Valor', 'Presentar y aprobar examen de certificación', 'Ej: TOEFL', 'task', 5, true, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 2.3: Creatividad
    ('Cultivar la Creatividad y la Curiosidad', 'Escribir una idea nueva en una libreta', '', 'habit', 2, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Cultivar la Creatividad y la Curiosidad', 'Dedicar sábado por la mañana a hobby creativo', '', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['S'], NULL, NULL),
    ('Cultivar la Creatividad y la Curiosidad', 'Visitar un museo o galería de arte diferente', '', 'task', 3, false, NOW(), 'TRIMESTRAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Cultivar la Creatividad y la Curiosidad', 'Inscribirme y completar un curso corto', 'Fuera de mi zona de confort.', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 3.1: Pareja
    ('Fortalecer el Vínculo con mi Pareja', 'Tener una "cita nocturna" semanal', '', 'habit', 5, true, NOW(), 'SEMANAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Fortalecer el Vínculo con mi Pareja', 'Realizar un "check-in" emocional de 15 minutos', 'Cada domingo.', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['D'], NULL, NULL),
    ('Fortalecer el Vínculo con mi Pareja', 'Expresar un agradecimiento genuino a mi pareja', '', 'habit', 3, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Fortalecer el Vínculo con mi Pareja', 'Planificar un viaje de fin de semana solos', '', 'task', 5, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 3.2: Amistades
    ('Cultivar Amistades de Calidad', 'Iniciar conversación por mensaje con un amigo diferente', '', 'habit', 2, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Cultivar Amistades de Calidad', 'Organizar una junta con amigos una vez al mes', '', 'habit', 4, false, NOW(), 'MENSUAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Cultivar Amistades de Calidad', 'Llamar por teléfono a un amigo que vive lejos', 'No texto.', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO_RECURRENTE', 'binary', NULL, NULL, NULL, 2),
    ('Cultivar Amistades de Calidad', 'Ser el organizador de la próxima reunión', '', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 3.3: Familia
    ('Ser un Pilar Presente para mi Familia', 'Estar 100% presente durante la cena familiar', 'Sin teléfonos.', 'habit', 4, true, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Ser un Pilar Presente para mi Familia', 'Llamar a mis padres/abuelos cada domingo', '', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['D'], NULL, NULL),
    ('Ser un Pilar Presente para mi Familia', 'Organizar la celebración del próximo cumpleaños', '', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),
    ('Ser un Pilar Presente para mi Familia', 'Digitalizar las fotos familiares antiguas', '', 'task', 3, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 4.1: Productividad
    ('Aumentar mi Enfoque y Productividad en el Trabajo', 'Aplicar técnica Pomodoro 4 bloques/día', '', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'quantitative', '{"target_count": 4, "unit": "bloques"}', ARRAY['L','M','X','J','V'], NULL, NULL),
    ('Aumentar mi Enfoque y Productividad en el Trabajo', 'Revisar y priorizar emails 2 veces/día', '10 AM y 4 PM.', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['L','M','X','J','V'], NULL, NULL),
    ('Aumentar mi Enfoque y Productividad en el Trabajo', 'Planificar la siguiente semana cada viernes', '', 'habit', 5, true, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['V'], NULL, NULL),
    ('Aumentar mi Enfoque y Productividad en el Trabajo', 'Liderar y entregar exitosamente el "Proyecto Alfa"', '', 'task', 5, true, NOW(), 'TRIMESTRAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),

    -- Área 4.2: Finanzas
    ('Construir un Sistema Financiero Antifrágil', 'Revisar cuentas y presupuesto cada domingo', '', 'habit', 4, true, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['D'], NULL, NULL),
    ('Construir un Sistema Financiero Antifrágil', 'Automatizar transferencia del 15% a inversión', 'El día de pago.', 'habit', 5, true, NOW(), 'MENSUAL_DIA_FIJO', 'binary', NULL, NULL, 1, NULL),
    ('Construir un Sistema Financiero Antifrágil', 'Crear o actualizar mi fondo de emergencia', '6 meses de gastos.', 'task', 5, true, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),
    ('Construir un Sistema Financiero Antifrágil', 'Completar una asesoría con un planificador financiero', '', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 4.3: Emprendimiento
    ('Generar una Nueva Fuente de Ingresos', 'Dedicar 5 horas semanales a proyecto secundario', '', 'habit', 4, true, NOW(), 'SEMANAL_ACUMULATIVO', 'quantitative', '{"target_count": 5, "unit": "horas"}', NULL, NULL, NULL),
    ('Generar una Nueva Fuente de Ingresos', 'Publicar un contenido de valor semanalmente', 'Blog, video, etc.', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Generar una Nueva Fuente de Ingresos', 'Obtener mi primer cliente o venta', 'Antes de fin de trimestre.', 'task', 5, true, NOW(), 'TRIMESTRAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Generar una Nueva Fuente de Ingresos', 'Formalizar legalmente el emprendimiento', '', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 5.1: Mindfulness
    ('Desarrollar una Práctica de Mindfulness y Serenidad', 'Meditar por 15 minutos cada mañana', '', 'habit', 5, true, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Desarrollar una Práctica de Mindfulness y Serenidad', 'Realizar 3 pausas de respiración consciente', 'Durante el día laboral.', 'habit', 2, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'quantitative', '{"target_count": 3, "unit": "pausas"}', ARRAY['L','M','X','J','V'], NULL, NULL),
    ('Desarrollar una Práctica de Mindfulness y Serenidad', 'Escribir en un diario de gratitud cada noche', '', 'habit', 3, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Desarrollar una Práctica de Mindfulness y Serenidad', 'Participar en un retiro de meditación', 'De un día completo.', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 5.2: Hobby
    ('Dedicar Tiempo a un Hobby Apasionante', 'Practicar instrumento musical 30 mins', '', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', 'quantitative', '{"target_count": 4, "unit": "veces"}', NULL, NULL, NULL),
    ('Dedicar Tiempo a un Hobby Apasionante', 'Dedicar la tarde del sábado al hobby', 'Carpintería, jardinería, etc.', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', 'binary', NULL, ARRAY['S'], NULL, NULL),
    ('Dedicar Tiempo a un Hobby Apasionante', 'Aprender y dominar una nueva pieza musical/técnica', 'Cada mes.', 'task', 4, false, NOW(), 'MENSUAL_ACUMULATIVO', 'binary', NULL, NULL, NULL, NULL),
    ('Dedicar Tiempo a un Hobby Apasionante', 'Construir o crear mi primer proyecto completo', 'Una mesa, un cuadro, etc.', 'task', 5, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),

    -- Área 5.3: Contribución
    ('Contribuir a mi Entorno y Comunidad', 'Separar los residuos para reciclaje rigurosamente', '', 'habit', 2, false, NOW(), 'DIARIA', 'binary', NULL, NULL, NULL, NULL),
    ('Contribuir a mi Entorno y Comunidad', 'Participar como voluntario en jornada de reforestación', '', 'task', 4, false, NOW(), NULL, 'binary', NULL, NULL, NULL, NULL),
    ('Contribuir a mi Entorno y Comunidad', 'Donar sangre dos veces este año', '', 'task', 5, false, NOW(), 'ANUAL_ACUMULATIVO', 'quantitative', '{"target_count": 2, "unit": "veces"}', NULL, NULL, NULL),
    ('Contribuir a mi Entorno y Comunidad', 'Realizar una donación mensual automática a una causa', '', 'habit', 3, false, NOW(), 'MENSUAL_DIA_FIJO', 'binary', NULL, NULL, 15, NULL)
) AS v(ap_title, title, description, type, weight, is_critical, start_date, frequency, measurement_type, measurement_goal, frequency_days, frequency_day_of_month, frequency_interval) ON ap.title = v.ap_title;
