-- Este script borra todos los datos existentes y los reemplaza con un nuevo conjunto de datos de ejemplo.
-- Útil para desarrollo y pruebas.

-- Borrar datos en el orden correcto para evitar violaciones de clave foránea.
TRUNCATE TABLE progress_logs, habit_tasks, area_prks, life_prks RESTART IDENTITY CASCADE;

-- Insertar los 5 Pilares de Vida
INSERT INTO life_prks (title, description) VALUES
('Salud y Energía Vital ⚡', 'Mantener un cuerpo y mente sanos, enérgicos y resilientes para disfrutar la vida al máximo.'),
('Mente y Crecimiento Personal 🧠', 'Cultivar una mente curiosa, aprender continuamente y adquirir nuevas habilidades.'),
('Relaciones y Conexión Humana ❤️', 'Construir y mantener vínculos profundos y significativos con mi pareja, familia y amigos.'),
('Trabajo y Finanzas 📈', 'Alcanzar la excelencia profesional, la seguridad financiera y generar valor a través de mi trabajo.'),
('Propósito y Contribución ✨', 'Vivir una vida con sentido, dedicar tiempo a mis pasiones y dejar un impacto positivo en mi entorno.');

-- Insertar los PRK de Área, vinculados a los Pilares de Vida por su título
INSERT INTO area_prks (life_prk_id, title, description, unit, target_value, current_value) VALUES
-- Áreas para "Salud y Energía Vital"
((SELECT id from life_prks WHERE title = 'Salud y Energía Vital ⚡'), 'Optimizar mi Nutrición y Composición Corporal', 'Lograr una alimentación balanceada y un peso saludable a través de buenos hábitos.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Salud y Energía Vital ⚡'), 'Mejorar mi Descanso y Recuperación', 'Garantizar un sueño de calidad y reparador para maximizar la energía diaria.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Salud y Energía Vital ⚡'), 'Incrementar mi Resistencia y Fuerza Física', 'Construir un cuerpo fuerte, resistente y capaz de superar desafíos físicos.', '%', 100, 0),
-- Áreas para "Mente y Crecimiento Personal"
((SELECT id from life_prks WHERE title = 'Mente y Crecimiento Personal 🧠'), 'Desarrollar el Hábito de la Lectura Profunda', 'Leer de manera consistente para adquirir conocimiento y expandir mi perspectiva.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Mente y Crecimiento Personal 🧠'), 'Adquirir una Nueva Habilidad de Alto Valor', 'Dominar una competencia que impulse mi desarrollo profesional y personal, como el inglés de negocios.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Mente y Crecimiento Personal 🧠'), 'Cultivar la Creatividad y la Curiosidad', 'Dedicar tiempo a explorar ideas, hobbies y experiencias que estimulen mi lado creativo.', '%', 100, 0),
-- Áreas para "Relaciones y Conexión Humana"
((SELECT id from life_prks WHERE title = 'Relaciones y Conexión Humana ❤️'), 'Fortalecer el Vínculo con mi Pareja', 'Invertir tiempo y energía en nutrir la complicidad, la comunicación y el romance.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Relaciones y Conexión Humana ❤️'), 'Cultivar Amistades de Calidad', 'Ser un amigo presente, proactivo y confiable para mi círculo cercano.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Relaciones y Conexión Humana ❤️'), 'Ser un Pilar Presente para mi Familia', 'Estar disponible, atento y participar activamente en la vida de mis seres queridos.', '%', 100, 0),
-- Áreas para "Trabajo y Finanzas"
((SELECT id from life_prks WHERE title = 'Trabajo y Finanzas 📈'), 'Aumentar mi Enfoque y Productividad en el Trabajo', 'Implementar sistemas para trabajar de manera más profunda, eficiente y con menos estrés.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Trabajo y Finanzas 📈'), 'Construir un Sistema Financiero Antifrágil', 'Lograr una posición económica sólida a través del ahorro, la inversión y la gestión inteligente.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Trabajo y Finanzas 📈'), 'Generar una Nueva Fuente de Ingresos', 'Crear y escalar un proyecto secundario que aporte valor y diversifique mis ingresos.', '%', 100, 0),
-- Áreas para "Propósito y Contribución"
((SELECT id from life_prks WHERE title = 'Propósito y Contribución ✨'), 'Desarrollar una Práctica de Mindfulness y Serenidad', 'Integrar la meditación y la atención plena para una mayor paz mental.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Propósito y Contribución ✨'), 'Dedicar Tiempo a un Hobby Apasionante', 'Disfrutar y crecer a través de una actividad que me apasione y me recargue de energía.', '%', 100, 0),
((SELECT id from life_prks WHERE title = 'Propósito y Contribución ✨'), 'Contribuir a mi Entorno y Comunidad', 'Realizar acciones concretas que generen un impacto positivo, por pequeño que sea.', '%', 100, 0);

-- Insertar todos los Hábitos, Tareas y Compromisos
INSERT INTO habit_tasks (
  area_prk_id, 
  title, 
  description, 
  type, 
  weight, 
  is_critical, 
  start_date, 
  due_date, 
  frequency, 
  frequency_days, 
  frequency_day_of_month, 
  frequency_interval, 
  measurement_type, 
  measurement_goal
) VALUES
-- Pilar: Salud y Energía Vital ⚡
-- Área 1.1: Optimizar mi Nutrición y Composición Corporal
((SELECT id from area_prks WHERE title = 'Optimizar mi Nutrición y Composición Corporal'), 'Beber 2.5 litros de agua al día', NULL, 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'quantitative', '{"target_count": 2.5, "unit": "litros"}'),
((SELECT id from area_prks WHERE title = 'Optimizar mi Nutrición y Composición Corporal'), 'Consumir un mínimo de 4 porciones de vegetales diariamente', NULL, 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'quantitative', '{"target_count": 4, "unit": "porciones"}'),
((SELECT id from area_prks WHERE title = 'Optimizar mi Nutrición y Composición Corporal'), 'No consumir alimentos procesados', 'De Lunes a Viernes', 'habit', 4, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"L","M","X","J","V"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Optimizar mi Nutrición y Composición Corporal'), 'Realizar una consulta con un nutricionista', 'Para un plan personalizado.', 'task', 5, false, now(), now() + interval '1 month', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 1.2: Mejorar mi Descanso y Recuperación
((SELECT id from area_prks WHERE title = 'Mejorar mi Descanso y Recuperación'), 'Acostarme y levantarme a la misma hora', 'Incluso fines de semana', 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Mejorar mi Descanso y Recuperación'), 'No usar pantallas 60 mins antes de dormir', NULL, 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Mejorar mi Descanso y Recuperación'), 'Leer 10 páginas de un libro de ficción', 'Para relajar la mente antes de dormir.', 'habit', 1, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Mejorar mi Descanso y Recuperación'), 'Comprar e instalar cortinas blackout', 'Para la habitación este mes.', 'task', 4, false, now(), now() + interval '1 month', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 1.3: Incrementar mi Resistencia y Fuerza Física
((SELECT id from area_prks WHERE title = 'Incrementar mi Resistencia y Fuerza Física'), 'Correr 3 veces por semana', 'Lunes, Miércoles y Viernes', 'habit', 3, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"L","X","V"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Incrementar mi Resistencia y Fuerza Física'), 'Realizar 2 sesiones de entrenamiento de fuerza', 'Martes y Jueves', 'habit', 3, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"M","J"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Incrementar mi Resistencia y Fuerza Física'), 'Inscribirme y completar una carrera de 10K', 'Este semestre.', 'task', 5, true, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Incrementar mi Resistencia y Fuerza Física'), 'Alcanzar la meta de levantar mi propio peso en sentadillas', NULL, 'task', 4, false, now(), now() + interval '4 months', NULL, NULL, NULL, NULL, 'binary', NULL),

-- Pilar: Mente y Crecimiento Personal 🧠
-- Área 2.1: Desarrollar el Hábito de la Lectura Profunda
((SELECT id from area_prks WHERE title = 'Desarrollar el Hábito de la Lectura Profunda'), 'Leer 30 minutos de un libro de no-ficción', 'Cada mañana', 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Desarrollar el Hábito de la Lectura Profunda'), 'Escuchar un audiolibro o podcast educativo', 'Durante los traslados', 'habit', 2, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"L","M","X","J","V"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Desarrollar el Hábito de la Lectura Profunda'), 'Terminar 12 libros este año', 'Uno por mes', 'habit', 5, false, now(), now() + interval '1 year', 'ANUAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 12}'),
((SELECT id from area_prks WHERE title = 'Desarrollar el Hábito de la Lectura Profunda'), 'Escribir un resumen de una página por cada libro leído', 'Para consolidar el aprendizaje', 'task', 4, false, now(), now() + interval '1 year', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 2.2: Adquirir una Nueva Habilidad de Alto Valor
((SELECT id from area_prks WHERE title = 'Adquirir una Nueva Habilidad de Alto Valor'), 'Completar 3 lecciones en una app de idiomas por semana', NULL, 'habit', 3, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 3}'),
((SELECT id from area_prks WHERE title = 'Adquirir una Nueva Habilidad de Alto Valor'), 'Ver una serie o película en inglés', 'Con subtítulos en inglés, dos veces por semana', 'habit', 2, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 2}'),
((SELECT id from area_prks WHERE title = 'Adquirir una Nueva Habilidad de Alto Valor'), 'Practicar conversación con un compañero', '30 minutos semanales', 'habit', 4, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'quantitative', '{"target_count": 30, "unit": "min"}'),
((SELECT id from area_prks WHERE title = 'Adquirir una Nueva Habilidad de Alto Valor'), 'Presentar y aprobar un examen de certificación', 'Ej: TOEFL', 'task', 5, true, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 2.3: Cultivar la Creatividad y la Curiosidad
((SELECT id from area_prks WHERE title = 'Cultivar la Creatividad y la Curiosidad'), 'Escribir una idea nueva en una libreta', 'De cualquier tipo, cada día.', 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Cultivar la Creatividad y la Curiosidad'), 'Dedicar el sábado por la mañana a un hobby creativo', 'Pintar, tocar música, etc.', 'habit', 3, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"S"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Cultivar la Creatividad y la Curiosidad'), 'Visitar un museo o galería de arte diferente', 'Cada trimestre.', 'habit', 3, false, now(), now() + interval '1 year', 'TRIMESTRAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Cultivar la Creatividad y la Curiosidad'), 'Inscribirme y completar un curso corto', 'De algo fuera de mi zona de confort (ej: cerámica)', 'task', 4, false, now(), now() + interval '3 months', NULL, NULL, NULL, NULL, 'binary', NULL),

-- Pilar: Relaciones y Conexión Humana ❤️
-- Área 3.1: Fortalecer el Vínculo con mi Pareja
((SELECT id from area_prks WHERE title = 'Fortalecer el Vínculo con mi Pareja'), 'Tener una "cita nocturna" semanal', 'Ya sea en casa o fuera.', 'habit', 4, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Fortalecer el Vínculo con mi Pareja'), 'Realizar un "check-in" emocional de 15 minutos', 'Cada domingo para hablar de la semana.', 'habit', 3, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"D"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Fortalecer el Vínculo con mi Pareja'), 'Expresar un agradecimiento o aprecio genuino', 'A mi pareja cada día.', 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Fortalecer el Vínculo con mi Pareja'), 'Planificar un viaje de fin de semana solos', 'Sin distracciones.', 'task', 5, false, now(), now() + interval '3 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 3.2: Cultivar Amistades de Calidad
((SELECT id from area_prks WHERE title = 'Cultivar Amistades de Calidad'), 'Iniciar una conversación por mensaje con un amigo', 'Diferente cada día.', 'habit', 1, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Cultivar Amistades de Calidad'), 'Organizar una junta con mi grupo de amigos', 'Una vez al mes.', 'habit', 3, false, now(), NULL, 'MENSUAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Cultivar Amistades de Calidad'), 'Llamar por teléfono (no texto) a un amigo', 'Que vive lejos cada semana.', 'habit', 4, false, now(), now() + interval '6 months', 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Cultivar Amistades de Calidad'), 'Ser el organizador de la próxima reunión', 'Evento importante del grupo.', 'task', 4, false, now(), now() + interval '4 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 3.3: Ser un Pilar Presente para mi Familia
((SELECT id from area_prks WHERE title = 'Ser un Pilar Presente para mi Familia'), 'Estar 100% presente durante la cena familiar', 'Sin teléfonos sobre la mesa.', 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Ser un Pilar Presente para mi Familia'), 'Llamar a mis padres/abuelos cada domingo', 'Por la tarde.', 'habit', 2, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"D"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Ser un Pilar Presente para mi Familia'), 'Organizar la celebración del próximo cumpleaños', 'Importante de un familiar.', 'task', 5, false, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Ser un Pilar Presente para mi Familia'), 'Digitalizar las fotos familiares antiguas', 'Y crear un álbum compartido online.', 'task', 4, false, now(), now() + interval '1 year', NULL, NULL, NULL, NULL, 'binary', NULL),

-- Pilar: Trabajo y Finanzas 📈
-- Área 4.1: Aumentar mi Enfoque y Productividad en el Trabajo
((SELECT id from area_prks WHERE title = 'Aumentar mi Enfoque y Productividad en el Trabajo'), 'Aplicar la técnica Pomodoro 4 veces al día', NULL, 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', '{"target_count": 4}'),
((SELECT id from area_prks WHERE title = 'Aumentar mi Enfoque y Productividad en el Trabajo'), 'Revisar y priorizar mis emails 2 veces al día', '10 AM y 4 PM.', 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', '{"target_count": 2}'),
((SELECT id from area_prks WHERE title = 'Aumentar mi Enfoque y Productividad en el Trabajo'), 'Planificar las prioridades de la siguiente semana', 'Cada viernes al terminar la jornada.', 'habit', 4, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"V"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Aumentar mi Enfoque y Productividad en el Trabajo'), 'Liderar y entregar exitosamente el "Proyecto Alfa"', 'Este trimestre.', 'task', 5, true, now(), now() + interval '3 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 4.2: Construir un Sistema Financiero Antifrágil
((SELECT id from area_prks WHERE title = 'Construir un Sistema Financiero Antifrágil'), 'Revisar mis cuentas y presupuesto cada domingo', 'Por la mañana.', 'habit', 3, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"D"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Construir un Sistema Financiero Antifrágil'), 'Automatizar una transferencia del 15% de mi sueldo', 'A mi cuenta de inversión el día de pago.', 'habit', 5, false, now(), NULL, 'MENSUAL_DIA_FIJO', NULL, 1, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Construir un Sistema Financiero Antifrágil'), 'Crear o actualizar mi fondo de emergencia', 'Para cubrir 6 meses de gastos.', 'task', 5, true, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Construir un Sistema Financiero Antifrágil'), 'Completar una asesoría con un planificador financiero', 'Para optimizar mi estrategia.', 'task', 4, false, now(), now() + interval '3 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 4.3: Generar una Nueva Fuente de Ingresos
((SELECT id from area_prks WHERE title = 'Generar una Nueva Fuente de Ingresos'), 'Dedicar 5 horas semanales a mi proyecto secundario', NULL, 'habit', 3, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'quantitative', '{"target_count": 5, "unit": "horas"}'),
((SELECT id from area_prks WHERE title = 'Generar una Nueva Fuente de Ingresos'), 'Publicar un contenido de valor semanalmente', 'Blog, video, etc. para construir una audiencia.', 'habit', 2, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Generar una Nueva Fuente de Ingresos'), 'Obtener mi primer cliente o realizar mi primera venta', 'Antes de que termine el trimestre.', 'task', 5, true, now(), now() + interval '3 months', NULL, NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Generar una Nueva Fuente de Ingresos'), 'Formalizar legalmente el emprendimiento', 'Una vez que genere ingresos consistentes.', 'task', 4, false, now(), now() + interval '1 year', NULL, NULL, NULL, NULL, 'binary', NULL),

-- Pilar: Propósito y Contribución ✨
-- Área 5.1: Desarrollar una Práctica de Mindfulness y Serenidad
((SELECT id from area_prks WHERE title = 'Desarrollar una Práctica de Mindfulness y Serenidad'), 'Meditar por 15 minutos cada mañana', 'Sin falta.', 'habit', 4, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Desarrollar una Práctica de Mindfulness y Serenidad'), 'Realizar 3 pausas de respiración consciente', 'De 1 minuto durante el día laboral.', 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', '{"target_count": 3}'),
((SELECT id from area_prks WHERE title = 'Desarrollar una Práctica de Mindfulness y Serenidad'), 'Escribir en un diario de gratitud cada noche', 'Antes de dormir.', 'habit', 3, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Desarrollar una Práctica de Mindfulness y Serenidad'), 'Participar en un retiro de meditación de un día', NULL, 'task', 5, false, now(), now() + interval '4 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 5.2: Dedicar Tiempo a un Hobby Apasionante
((SELECT id from area_prks WHERE title = 'Dedicar Tiempo a un Hobby Apasionante'), 'Practicar un instrumento musical 4 veces/semana', '30 minutos por sesión.', 'habit', 3, false, now(), NULL, 'SEMANAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 4}'),
((SELECT id from area_prks WHERE title = 'Dedicar Tiempo a un Hobby Apasionante'), 'Dedicar la tarde del sábado a carpintería', 'O jardinería, pintura, etc.', 'habit', 2, false, now(), NULL, 'SEMANAL_DIAS_FIJOS', '{"S"}', NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Dedicar Tiempo a un Hobby Apasionante'), 'Aprender y dominar una nueva pieza musical o técnica', 'Cada mes.', 'habit', 4, false, now(), now() + interval '1 year', 'MENSUAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 1}'),
((SELECT id from area_prks WHERE title = 'Dedicar Tiempo a un Hobby Apasionante'), 'Construir o crear mi primer proyecto completo', 'Una mesa, un cuadro, etc.', 'task', 5, false, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
-- Área 5.3: Contribuir a mi Entorno y Comunidad
((SELECT id from area_prks WHERE title = 'Contribuir a mi Entorno y Comunidad'), 'Separar los residuos para reciclaje rigurosamente', 'En casa.', 'habit', 2, false, now(), NULL, 'DIARIA', NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Contribuir a mi Entorno y Comunidad'), 'Participar como voluntario en una jornada', 'De reforestación o limpieza local.', 'task', 4, false, now(), now() + interval '6 months', NULL, NULL, NULL, NULL, 'binary', NULL),
((SELECT id from area_prks WHERE title = 'Contribuir a mi Entorno y Comunidad'), 'Donar sangre dos veces este año', NULL, 'habit', 5, false, now(), now() + interval '1 year', 'ANUAL_ACUMULATIVO', NULL, NULL, NULL, 'binary', '{"target_count": 2}'),
((SELECT id from area_prks WHERE title = 'Contribuir a mi Entorno y Comunidad'), 'Realizar una donación mensual automática a una causa', 'Incluso si es pequeña.', 'habit', 3, false, now(), NULL, 'MENSUAL_ACUMULATIVO_RECURRENTE', NULL, NULL, 1, 'binary', '{"target_count": 1}');
