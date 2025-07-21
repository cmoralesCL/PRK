-- Nota: Este script está diseñado para una base de datos limpia.
-- Los UUIDs se generan aleatoriamente. Para ejecutar esto, necesitarás reemplazar
-- los marcadores de posición con los UUIDs reales generados después de cada inserción.
-- Sin embargo, para fines de demostración, se asume que los UUIDs se pueden referenciar así.
-- En una ejecución real, deberías capturar el 'id' de cada inserción y usarlo en las siguientes.

-- Se recomienda ejecutar este script sección por sección en el Editor SQL de Supabase.

-- Limpiar tablas en orden inverso para evitar problemas de foreign key constraints.
DELETE FROM "public"."progress_logs";
DELETE FROM "public"."habit_tasks";
DELETE FROM "public"."area_prks";
DELETE FROM "public"."life_prks";


-- 1. Pilar de Vida: Salud y Energía Vital
WITH life_prk_insert AS (
  INSERT INTO "public"."life_prks" (title, description, archived)
  VALUES ('Salud y Energía Vital ⚡', 'Sentirme con energía y vitalidad todos los días, cuidando mi cuerpo como el templo que es.', false)
  RETURNING id
),
area_prk_1_1 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Optimizar mi Nutrición y Composición Corporal', 'Alcanzar un estado óptimo de salud a través de una alimentación consciente y equilibrada.' FROM life_prk_insert
  RETURNING id
),
area_prk_1_2 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Mejorar mi Descanso y Recuperación', 'Dormir profundamente y despertar renovado para maximizar mi rendimiento diario.' FROM life_prk_insert
  RETURNING id
),
area_prk_1_3 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Incrementar mi Resistencia y Fuerza Física', 'Construir un cuerpo fuerte, resistente y capaz de superar cualquier reto físico.' FROM life_prk_insert
  RETURNING id
)
INSERT INTO "public"."habit_tasks" (area_prk_id, title, type, weight, is_critical, start_date, frequency, frequency_days, measurement_type, measurement_goal)
VALUES
-- Área 1.1: Nutrición
((SELECT id FROM area_prk_1_1), 'Beber 2.5 litros de agua al día', 'habit', 2, false, NOW(), 'DIARIA', null, 'quantitative', '{"target_count": 2.5, "unit": "L"}'),
((SELECT id FROM area_prk_1_1), 'Consumir un mínimo de 4 porciones de vegetales diariamente', 'habit', 3, false, NOW(), 'DIARIA', null, 'quantitative', '{"target_count": 4, "unit": "porciones"}'),
((SELECT id FROM area_prk_1_1), 'No consumir alimentos procesados', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"L", "M", "X", "J", "V"}', 'binary', null),
((SELECT id FROM area_prk_1_1), 'Realizar una consulta con un nutricionista para un plan personalizado', 'task', 5, true, NOW(), null, null, 'binary', null),
-- Área 1.2: Descanso
((SELECT id FROM area_prk_1_2), 'Acostarme y levantarme a la misma hora todos los días', 'habit', 4, true, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_1_2), 'No usar pantallas 60 minutos antes de dormir', 'habit', 3, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_1_2), 'Leer 10 páginas de un libro de ficción para relajar la mente', 'habit', 2, false, NOW(), 'DIARIA', null, 'quantitative', '{"target_count": 10, "unit": "páginas"}'),
((SELECT id FROM area_prk_1_2), 'Comprar e instalar cortinas blackout para la habitación', 'task', 4, false, (NOW() + interval '1 month'), null, null, 'binary', null),
-- Área 1.3: Fitness
((SELECT id FROM area_prk_1_3), 'Correr 3 veces por semana', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', null, 'binary', '{"target_count": 3}'),
((SELECT id FROM area_prk_1_3), 'Realizar 2 sesiones de entrenamiento de fuerza por semana', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"M", "J"}', 'binary', null),
((SELECT id FROM area_prk_1_3), 'Inscribirme y completar una carrera de 10K este semestre', 'task', 5, true, (NOW() + interval '6 months'), null, null, 'binary', null),
((SELECT id FROM area_prk_1_3), 'Alcanzar la meta de levantar mi propio peso en sentadillas', 'task', 5, false, (NOW() + interval '4 months'), null, null, 'binary', null);


-- 2. Pilar de Vida: Mente y Crecimiento Personal
WITH life_prk_insert AS (
  INSERT INTO "public"."life_prks" (title, description, archived)
  VALUES ('Mente y Crecimiento Personal 🧠', 'Expandir mi conocimiento, cultivar la curiosidad y adquirir habilidades valiosas continuamente.', false)
  RETURNING id
),
area_prk_2_1 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Desarrollar el Hábito de la Lectura Profunda', 'Ir más allá de la lectura superficial para internalizar y aplicar el conocimiento.' FROM life_prk_insert
  RETURNING id
),
area_prk_2_2 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Adquirir una Nueva Habilidad de Alto Valor', 'Aprender algo nuevo que abra puertas profesionales y personales, como el Inglés de Negocios.' FROM life_prk_insert
  RETURNING id
),
area_prk_2_3 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Cultivar la Creatividad y la Curiosidad', 'Mantener una mente abierta, explorar nuevas ideas y alimentar mi lado creativo.' FROM life_prk_insert
  RETURNING id
)
INSERT INTO "public"."habit_tasks" (area_prk_id, title, type, weight, is_critical, start_date, frequency, measurement_type, measurement_goal)
VALUES
-- Área 2.1: Lectura
((SELECT id FROM area_prk_2_1), 'Leer 30 minutos de un libro de no-ficción cada mañana', 'habit', 3, false, NOW(), 'DIARIA', 'binary', null),
((SELECT id FROM area_prk_2_1), 'Escuchar un audiolibro o podcast educativo durante los traslados', 'habit', 2, false, NOW(), 'DIARIA', 'binary', null),
((SELECT id FROM area_prk_2_1), 'Terminar 12 libros este año', 'habit', 5, true, NOW(), 'ANUAL_ACUMULATIVO', 'quantitative', '{"target_count": 12, "unit": "libros"}'),
((SELECT id FROM area_prk_2_1), 'Escribir un resumen de una página por cada libro leído', 'task', 4, false, (NOW() + interval '1 year'), null, 'binary', null),
-- Área 2.2: Habilidad
((SELECT id FROM area_prk_2_2), 'Completar 3 lecciones en una app de idiomas por semana', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', 'binary', '{"target_count": 3}'),
((SELECT id FROM area_prk_2_2), 'Ver una serie o película en inglés dos veces por semana', 'habit', 2, false, NOW(), 'SEMANAL_ACUMULATIVO', 'binary', '{"target_count": 2}'),
((SELECT id FROM area_prk_2_2), 'Practicar conversación con un compañero de intercambio', 'habit', 4, false, NOW(), 'SEMANAL_ACUMULATIVO', 'quantitative', '{"target_count": 30, "unit": "min"}'),
((SELECT id FROM area_prk_2_2), 'Presentar y aprobar un examen de certificación de nivel (ej: TOEFL)', 'task', 5, true, (NOW() + interval '1 year'), null, 'binary', null),
-- Área 2.3: Creatividad
((SELECT id FROM area_prk_2_3), 'Escribir una idea nueva en una libreta cada día', 'habit', 2, false, NOW(), 'DIARIA', 'binary', null),
((SELECT id FROM area_prk_2_3), 'Dedicar el sábado por la mañana a un hobby creativo', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"S"}', 'binary', null),
((SELECT id FROM area_prk_2_3), 'Visitar un museo o una galería de arte diferente cada trimestre', 'habit', 4, false, NOW(), 'TRIMESTRAL_ACUMULATIVO', 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_2_3), 'Inscribirme y completar un curso corto de algo fuera de mi zona de confort', 'task', 5, false, (NOW() + interval '6 months'), null, 'binary', null);


-- 3. Pilar de Vida: Relaciones y Conexión Humana
WITH life_prk_insert AS (
  INSERT INTO "public"."life_prks" (title, description, archived)
  VALUES ('Relaciones y Conexión Humana ❤️', 'Nutrir y fortalecer los lazos con las personas más importantes de mi vida.', false)
  RETURNING id
),
area_prk_3_1 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Fortalecer el Vínculo con mi Pareja', 'Ser un compañero presente, atento y amoroso.' FROM life_prk_insert
  RETURNING id
),
area_prk_3_2 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Cultivar Amistades de Calidad', 'Invertir tiempo y energía en amistades que me nutran y apoyen.' FROM life_prk_insert
  RETURNING id
),
area_prk_3_3 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Ser un Pilar Presente para mi Familia', 'Estar disponible y participar activamente en la vida familiar.' FROM life_prk_insert
  RETURNING id
)
INSERT INTO "public"."habit_tasks" (area_prk_id, title, type, weight, is_critical, start_date, frequency, frequency_day_of_month, measurement_type, measurement_goal)
VALUES
-- Área 3.1: Pareja
((SELECT id FROM area_prk_3_1), 'Tener una "cita nocturna" semanal', 'habit', 5, true, NOW(), 'SEMANAL_ACUMULATIVO', null, 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_3_1), 'Realizar un "check-in" emocional de 15 minutos cada domingo', 'habit', 4, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"D"}', 'binary', null),
((SELECT id FROM area_prk_3_1), 'Expresar un agradecimiento o aprecio genuino a mi pareja', 'habit', 3, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_3_1), 'Planificar un viaje de fin de semana solos', 'task', 5, false, (NOW() + interval '3 months'), null, null, 'binary', null),
-- Área 3.2: Amigos
((SELECT id FROM area_prk_3_2), 'Iniciar una conversación por mensaje con un amigo diferente', 'habit', 2, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_3_2), 'Organizar una junta con mi grupo de amigos una vez al mes', 'habit', 4, false, NOW(), 'MENSUAL_ACUMULATIVO', null, 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_3_2), 'Llamar por teléfono a un amigo que vive lejos', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', null, 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_3_2), 'Ser el organizador de la próxima reunión importante del grupo', 'task', 4, false, (NOW() + interval '4 months'), null, null, 'binary', null),
-- Área 3.3: Familia
((SELECT id FROM area_prk_3_3), 'Estar 100% presente durante la cena familiar (sin teléfonos)', 'habit', 4, true, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_3_3), 'Llamar a mis padres/abuelos cada domingo por la tarde', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"D"}', 'binary', null),
((SELECT id FROM area_prk_3_3), 'Organizar la celebración del próximo cumpleaños importante', 'task', 5, false, (NOW() + interval '5 months'), null, null, 'binary', null),
((SELECT id FROM area_prk_3_3), 'Digitalizar las fotos familiares antiguas', 'task', 3, false, (NOW() + interval '6 months'), null, null, 'binary', null);

-- 4. Pilar de Vida: Trabajo y Finanzas
WITH life_prk_insert AS (
  INSERT INTO "public"."life_prks" (title, description, archived)
  VALUES ('Trabajo y Finanzas 📈', 'Alcanzar la excelencia profesional y la solidez financiera.', false)
  RETURNING id
),
area_prk_4_1 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Aumentar mi Enfoque y Productividad en el Trabajo', 'Trabajar de forma más inteligente, no más dura.' FROM life_prk_insert
  RETURNING id
),
area_prk_4_2 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Construir un Sistema Financiero Antifrágil', 'Tener control y tranquilidad sobre mis finanzas personales.' FROM life_prk_insert
  RETURNING id
),
area_prk_4_3 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Generar una Nueva Fuente de Ingresos (Emprendimiento)', 'Crear un proyecto secundario que genere valor y ingresos.' FROM life_prk_insert
  RETURNING id
)
INSERT INTO "public"."habit_tasks" (area_prk_id, title, type, weight, is_critical, start_date, frequency, frequency_interval, measurement_type, measurement_goal)
VALUES
-- Área 4.1: Productividad
((SELECT id FROM area_prk_4_1), 'Aplicar la técnica Pomodoro para lograr 4 bloques de trabajo profundo', 'habit', 4, false, NOW(), 'DIARIA', null, 'quantitative', '{"target_count": 4, "unit": "bloques"}'),
((SELECT id FROM area_prk_4_1), 'Revisar y priorizar mis emails solo 2 veces al día', 'habit', 3, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_4_1), 'Planificar las prioridades de la siguiente semana', 'habit', 5, true, NOW(), 'SEMANAL_DIAS_FIJOS', '{"V"}', 'binary', null),
((SELECT id FROM area_prk_4_1), 'Liderar y entregar exitosamente el "Proyecto Alfa"', 'task', 5, true, (NOW() + interval '3 months'), null, null, 'binary', null),
-- Área 4.2: Finanzas
((SELECT id FROM area_prk_4_2), 'Revisar mis cuentas y presupuesto cada domingo', 'habit', 4, true, NOW(), 'SEMANAL_DIAS_FIJOS', '{"D"}', 'binary', null),
((SELECT id FROM area_prk_4_2), 'Automatizar transferencia del 15% del sueldo a inversión', 'habit', 5, false, NOW(), 'MENSUAL_DIA_FIJO', 1, 'binary', null),
((SELECT id FROM area_prk_4_2), 'Crear o actualizar mi fondo de emergencia para 6 meses', 'task', 5, true, (NOW() + interval '1 year'), null, null, 'binary', null),
((SELECT id FROM area_prk_4_2), 'Completar una asesoría con un planificador financiero', 'task', 4, false, (NOW() + interval '2 months'), null, null, 'binary', null),
-- Área 4.3: Emprendimiento
((SELECT id FROM area_prk_4_3), 'Dedicar 5 horas semanales a mi proyecto secundario', 'habit', 4, true, NOW(), 'SEMANAL_ACUMULATIVO', null, 'quantitative', '{"target_count": 5, "unit": "horas"}'),
((SELECT id FROM area_prk_4_3), 'Publicar un contenido de valor semanalmente', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', null, 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_4_3), 'Obtener mi primer cliente o realizar mi primera venta', 'task', 5, true, (NOW() + interval '3 months'), null, null, 'binary', null),
((SELECT id FROM area_prk_4_3), 'Formalizar legalmente el emprendimiento', 'task', 3, false, (NOW() + interval '8 months'), null, null, 'binary', null);


-- 5. Pilar de Vida: Propósito y Contribución
WITH life_prk_insert AS (
  INSERT INTO "public"."life_prks" (title, description, archived)
  VALUES ('Propósito y Contribución ✨', 'Vivir una vida con sentido, cultivando pasiones y aportando al mundo.', false)
  RETURNING id
),
area_prk_5_1 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Desarrollar una Práctica de Mindfulness y Serenidad', 'Encontrar calma y claridad en el día a día.' FROM life_prk_insert
  RETURNING id
),
area_prk_5_2 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Dedicar Tiempo a un Hobby Apasionante', 'Nutrir mis pasiones personales fuera del trabajo.' FROM life_prk_insert
  RETURNING id
),
area_prk_5_3 AS (
  INSERT INTO "public"."area_prks" (life_prk_id, title, description)
  SELECT id, 'Contribuir a mi Entorno y Comunidad', 'Dejar un impacto positivo, por pequeño que sea.' FROM life_prk_insert
  RETURNING id
)
INSERT INTO "public"."habit_tasks" (area_prk_id, title, type, weight, is_critical, start_date, frequency, frequency_interval, measurement_type, measurement_goal)
VALUES
-- Área 5.1: Mindfulness
((SELECT id FROM area_prk_5_1), 'Meditar por 15 minutos cada mañana sin falta', 'habit', 4, true, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_5_1), 'Realizar 3 pausas de respiración consciente durante el día', 'habit', 2, false, NOW(), 'DIARIA', null, 'binary', '{"target_count": 3}'),
((SELECT id FROM area_prk_5_1), 'Escribir en un diario de gratitud cada noche', 'habit', 3, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_5_1), 'Participar en un retiro de meditación de un día completo', 'task', 5, false, (NOW() + interval '6 months'), null, null, 'binary', null),
-- Área 5.2: Hobby
((SELECT id FROM area_prk_5_2), 'Practicar un instrumento musical 30 minutos, 4 veces por semana', 'habit', 3, false, NOW(), 'SEMANAL_ACUMULATIVO', null, 'binary', '{"target_count": 4}'),
((SELECT id FROM area_prk_5_2), 'Dedicar la tarde del sábado a la carpintería/jardinería/pintura', 'habit', 3, false, NOW(), 'SEMANAL_DIAS_FIJOS', '{"S"}', 'binary', null),
((SELECT id FROM area_prk_5_2), 'Aprender y dominar una nueva pieza musical o técnica', 'habit', 4, false, NOW(), 'MENSUAL_ACUMULATIVO', null, 'binary', '{"target_count": 1}'),
((SELECT id FROM area_prk_5_2), 'Construir o crear mi primer proyecto completo (una mesa, un cuadro, etc.)', 'task', 5, false, (NOW() + interval '4 months'), null, null, 'binary', null),
-- Área 5.3: Contribución
((SELECT id FROM area_prk_5_3), 'Separar los residuos para reciclaje de forma rigurosa', 'habit', 2, false, NOW(), 'DIARIA', null, 'binary', null),
((SELECT id FROM area_prk_5_3), 'Participar como voluntario en una jornada de reforestación o limpieza', 'task', 4, false, (NOW() + interval '5 months'), null, null, 'binary', null),
((SELECT id FROM area_prk_5_3), 'Donar sangre dos veces este año', 'habit', 5, true, NOW(), 'ANUAL_ACUMULATIVO', null, 'binary', '{"target_count": 2}'),
((SELECT id FROM area_prk_5_3), 'Realizar una donación mensual automática a una causa benéfica', 'habit', 3, false, NOW(), 'MENSUAL_DIA_FIJO', 15, 'binary', null);
