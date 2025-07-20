Especificación Funcional del Motor de Frecuencias
1. Introducción
Este documento detalla la lógica de negocio para determinar cuándo una habit_tasks (Acción) está activa o debe ser medida. El objetivo es traducir la configuración de frecuencia de un usuario en un comportamiento predecible dentro del calendario y la barra lateral de compromisos de la aplicación.

Toda la lógica se basa en los campos de la tabla habit_tasks del modelo de datos proporcionado.

2. Concepto Central: Los Dos Comportamientos de Seguimiento
Toda Acción, sin importar su frecuencia, debe ser clasificada en uno de dos comportamientos de seguimiento. Esta clasificación determina dónde aparece en la UI y cómo se mide su progreso.

A. Acción con Fecha Específica
Concepto: La acción tiene una fecha de vencimiento exacta y determinada por el sistema.

Comportamiento en la UI: Aparece en el Calendario en el día o días específicos que le corresponden.

Medición: Su cumplimiento (o fallo) afecta directamente al cálculo de progreso diario de su PRK de Área asociado.

B. Compromiso por Período
Concepto: La acción es una meta flexible que debe cumplirse un número de veces dentro de un período de tiempo definido (semana, mes, trimestre, etc.), sin un día fijo asignado.

Comportamiento en la UI: Aparece en la Barra Lateral de "Compromisos" durante el período activo.

Medición: Su cumplimiento (parcial o total) afecta al cálculo de progreso del período (ej: "Progreso Semanal") de su PRK de Área asociado.

3. Guía Detallada por Frecuencia
A continuación se detalla cómo interpretar la configuración de la tabla habit_tasks para implementar cada tipo de frecuencia.

Grupo 1: Acciones con Fecha Específica
3.1 Diaria
Concepto: Una acción que debe realizarse todos los días.

Lógica de Determinación: La acción está activa si CURRENT_DATE >= start_date.

Configuración en habit_tasks:

frequency: 'DIARIA'

Comportamiento: Fecha Específica.

3.2 Días Específicos de la Semana
Concepto: Una acción que se repite solo en ciertos días de la semana.

Lógica de Determinación: La acción está activa si DAY_OF_WEEK(CURRENT_DATE) está contenido en el campo frequency_days.

Configuración en habit_tasks:

frequency: 'SEMANAL_ESPECIFICO'

frequency_days: 'L,M,V' (string con los días seleccionados)

Comportamiento: Fecha Específica.

3.3 Intervalo Fijo (Cada N Días/Semanas/Meses)
Concepto: Una acción que se repite en un ciclo fijo a partir de su última fecha de finalización.

Lógica de Determinación: La acción está activa si CURRENT_DATE == due_date. El due_date se calcula dinámicamente:

Si la tarea nunca se ha completado (completion_date es NULL), due_date = start_date.

Si la tarea ya se completó, due_date = completion_date + frequency_interval frequency_unit.

Configuración en habit_tasks:

frequency: 'INTERVALO'

frequency_interval: N (ej: 3)

frequency_unit: 'days', 'weeks', 'months'

Comportamiento: Fecha Específica.

3.4 Día Fijo del Mes
Concepto: Una acción anclada a una fecha numérica del mes.

Lógica de Determinación: La acción está activa si DAY(CURRENT_DATE) == frequency_day_of_month.

Manejo de Casos Límite: Si frequency_day_of_month es 31 y el mes actual tiene 30 días, la tarea debe vencer el día 30. Si es Febrero, debe vencer el 28 o 29.

Configuración en habit_tasks:

frequency: 'MENSUAL_DIA_FIJO'

frequency_day_of_month: N (ej: 15)

Comportamiento: Fecha Específica.

3.5 Anual
Concepto: Una acción que ocurre una vez al año en la misma fecha.

Lógica de Determinación: La acción está activa si MONTH(CURRENT_DATE) == MONTH(start_date) Y DAY(CURRENT_DATE) == DAY(start_date).

Configuración en habit_tasks:

frequency: 'ANUAL'

Comportamiento: Fecha Específica.

Grupo 2: Compromisos por Período
3.6 Por Semana / Mes / Trimestre (Acumulativo)
Concepto: Una meta de frecuencia a cumplir dentro de un período de calendario estándar.

Lógica de Determinación: La acción está activa si CURRENT_DATE está dentro del período actual (semana, mes o trimestre). El sistema debe llevar un conteo de las veces completadas (progress_logs) dentro de ese período.

Configuración en habit_tasks:

frequency: 'SEMANAL_ACUMULATIVO', 'MENSUAL_ACUMULATIVO', 'TRIMESTRAL_ACUMULATIVO'

measurement_goal: jsonb con el objetivo, ej: {"target_count": 5}

Comportamiento: Compromiso por Período.

3.7 Compromiso Semanal / Mensual Recurrente
Concepto: Un compromiso flexible que no ocurre en todos los períodos, sino en un ciclo (ej: una vez cada 3 semanas).

Lógica de Determinación:

Primero, el sistema debe determinar si la semana (o mes) actual es una "Semana Objetivo". Esto se calcula usando la start_date y el frequency_interval (ej: (CURRENT_WEEK - START_WEEK) % interval == 0).

Si es una Semana Objetivo, la acción se comporta como un Compromiso por Período normal (ver punto 3.6). En las demás semanas, permanece oculta.

Configuración en habit_tasks:

frequency: 'SEMANAL_ACUMULATIVO_RECURRENTE', 'MENSUAL_ACUMULATIVO_RECURRENTE'

frequency_interval: N (ej: 3 para "cada 3 semanas")

measurement_goal: jsonb con el objetivo, ej: {"target_count": 1}

Comportamiento: Compromiso por Período.

4. Reglas Generales de Cálculo
Ponderación (weight): Todos los cálculos de progreso (diarios o de período) deben ser promedios ponderados. El progreso de cada acción se multiplica por su weight antes de promediar.

Acciones Críticas (is_critical): Si una acción marcada como is_critical = true falla (progreso 0%), podría tener un efecto de "veto" o una penalización adicional en el puntaje del período, según se defina en la lógica de negocio.

Registro (progress_logs): Cada vez que un usuario registra un avance para una acción (la completa, o suma N páginas leídas), se debe crear un nuevo registro en la tabla progress_logs asociando el habit_task_id, la fecha y el valor del progreso.

Consolidación Diaria (daily_progress_snapshots): Al final de cada día, un proceso debe calcular el puntaje final de todos los PRK de Área para cada usuario y almacenarlo en daily_progress_snapshots. Este cálculo se basa en los progress_logs del día y en el estado de los Compromisos de período que cierran ese día.