Especificación Funcional Definitiva del Motor de Frecuencias para BRP
1. Introducción
Este documento es la fuente de verdad para la lógica de negocio que determina cuándo una habit_tasks (Acción) está activa y cómo debe medirse. El objetivo es proporcionar una guía inequívoca para su implementación, basada en el modelo de datos proporcionado.

2. Concepto Central: Los Dos Comportamientos de Seguimiento
Toda Acción se clasifica en uno de dos comportamientos, lo cual determina su lugar en la interfaz y su método de medición.

A. Acción con Fecha Específica
Concepto: La acción tiene una o varias fechas de vencimiento exactas y predecibles.

Comportamiento en la UI: Aparece en el Calendario en los días que le corresponden.

Medición: Afecta al cálculo de progreso diario de su PRK de Área.

B. Compromiso por Período
Concepto: Es una meta flexible a cumplir dentro de un período (semana, mes, etc.), sin un día fijo.

Comportamiento en la UI: Aparece en la Barra Lateral de "Compromisos" durante su período activo.

Medición: Afecta al cálculo de progreso del período completo (semanal, mensual, etc.).

3. Guía Detallada por Frecuencia
A continuación se describe cada tipo de frecuencia, su lógica y la configuración requerida en la tabla habit_tasks.

Grupo 1: Acciones con Fecha Específica
3.1 Diaria
Concepto: Una acción para todos los días.

Lógica: Activa si CURRENT_DATE >= start_date.

Configuración: frequency: 'DIARIA'

3.2 Días Específicos de la Semana
Concepto: Se repite en los mismos días cada semana.

Lógica: Activa si DAY_OF_WEEK(CURRENT_DATE) está en frequency_days.

Configuración: frequency: 'SEMANAL_DIAS_FIJOS', frequency_days: 'L,M,V'

3.3 Día Fijo del Mes
Concepto: Anclada a un número de día cada mes.

Lógica: Activa si DAY(CURRENT_DATE) == frequency_day_of_month. Debe manejar meses cortos (ej: día 31 en febrero debe vencer el 28/29).

Configuración: frequency: 'MENSUAL_DIA_FIJO', frequency_day_of_month: N

3.4 Anual (Fecha Fija)
Concepto: Ocurre una vez al año en la misma fecha.

Lógica: Activa si MONTH(CURRENT_DATE) == MONTH(start_date) Y DAY(CURRENT_DATE) == DAY(start_date).

Configuración: frequency: 'ANUAL_FECHA_FIJA'

3.5 Intervalo de Días
Concepto: Ciclo fijo de N días a partir de la última finalización.

Lógica: Activa si CURRENT_DATE == due_date. due_date se calcula como completion_date + frequency_interval days.

Configuración: frequency: 'INTERVALO_DIAS', frequency_interval: N

3.6 Intervalo Semanal con Días Fijos (NUEVO)
Concepto: Se repite en días específicos, pero solo en semanas que siguen un intervalo. (Ej: Los Lunes y Miércoles, cada 3 semanas).

Lógica de Determinación (2 pasos):

El sistema primero determina si la semana actual es una "Semana Objetivo" (usando start_date y frequency_interval).

Si lo es, entonces la lógica del punto 3.2 aplica: la acción estará activa si DAY_OF_WEEK(CURRENT_DATE) está en frequency_days.

Configuración: frequency: 'INTERVALO_SEMANAL_DIAS_FIJOS', frequency_interval: N, frequency_days: 'L,W'

3.7 Intervalo Mensual con Día Fijo (NUEVO)
Concepto: Ocurre en una fecha numérica, pero solo en meses que siguen un intervalo. (Ej: El día 15, cada 2 meses).

Lógica de Determinación (2 pasos):

El sistema determina si el mes actual es un "Mes Objetivo".

Si lo es, la lógica del punto 3.3 aplica: la acción estará activa si DAY(CURRENT_DATE) == frequency_day_of_month.

Configuración: frequency: 'INTERVALO_MENSUAL_DIA_FIJO', frequency_interval: N, frequency_day_of_month: 15

Grupo 2: Compromisos por Período
3.8 Por Semana (Acumulativo)
Concepto: Meta de frecuencia a cumplir dentro de cada semana.

Lógica: Activa durante toda la semana. Se usa un contador para X veces.

Configuración: frequency: 'SEMANAL_ACUMULATIVO', measurement_goal: {"target_count": X}

3.9 Por Mes (Acumulativo)
Concepto: Meta de frecuencia a cumplir dentro de cada mes.

Configuración: frequency: 'MENSUAL_ACUMULATIVO', measurement_goal: {"target_count": X}

3.10 Por Trimestre (Acumulativo)
Concepto: Meta de frecuencia a cumplir dentro de cada trimestre fiscal (Q1, Q2, Q3, Q4).

Configuración: frequency: 'TRIMESTRAL_ACUMULATIVO', measurement_goal: {"target_count": X}

3.11 Anual (Compromiso Flexible)
Concepto: Meta de frecuencia a cumplir a lo largo de todo el año calendario.

Configuración: frequency: 'ANUAL_ACUMULATIVO', measurement_goal: {"target_count": X}

3.12 Compromiso Semanal Recurrente
Concepto: Un compromiso semanal que solo aparece en semanas que siguen un intervalo.

Lógica: El sistema determina si la semana actual es una "Semana Objetivo" (usando start_date y frequency_interval). Si lo es, la acción aparece en la barra lateral de compromisos para esa semana.

Configuración: frequency: 'SEMANAL_ACUMULATIVO_RECURRENTE', frequency_interval: N, measurement_goal: {"target_count": X}

3.13 Compromiso Mensual/Trimestral Recurrente
Concepto: Un compromiso mensual/trimestral que solo aparece en períodos que siguen un intervalo.

Lógica: Similar al anterior, pero aplicado a meses o trimestres.

Configuración: frequency: 'MENSUAL_ACUMULATIVO_RECURRENTE' o 'TRIMESTRAL_ACUMULATIVO_RECURRENTE', frequency_interval: N, measurement_goal: {"target_count": X}

4. Reglas Generales de Cálculo y Registro
Ponderación (weight): Todos los cálculos de progreso deben ser promedios ponderados usando este campo.

Acciones Críticas (is_critical): Una acción crítica fallida debe tener un impacto significativamente mayor en el puntaje, potencialmente reduciendo el progreso del PRK a 0 para ese período, independientemente de otras acciones completadas.

Registro (progress_logs): Cada cumplimiento de una acción (completar una tarea binaria, registrar N minutos de meditación, etc.) debe generar un registro en progress_logs. Este es el evento atómico del sistema.

Consolidación (daily_progress_snapshots): Al final del día, un proceso debe calcular y almacenar el progreso consolidado. Este proceso debe tener en cuenta los progress_logs del día y el estado de cualquier "Compromiso por Período" que cierre en esa fecha (fin de semana, fin de mes, etc.).