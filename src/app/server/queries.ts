import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfWeek, startOfMonth, differenceInDays, isAfter, parseISO, isBefore, isEqual, startOfDay } from 'date-fns';

// Helper para mapear snake_case a camelCase para HabitTask
const mapHabitTaskFromDb = (dbData: any): HabitTask => ({
    id: dbData.id,
    areaPrkId: dbData.area_prk_id,
    title: dbData.title,
    type: dbData.type,
    created_at: dbData.created_at,
    archived: dbData.archived,
    startDate: dbData.start_date,
    dueDate: dbData.due_date,
    completionDate: dbData.completion_date,
    frequency: dbData.frequency,
    frequencyDays: dbData.frequency_days,
    weight: dbData.weight,
});

const calculateHabitProgress = (habit: HabitTask, logs: ProgressLog[], selectedDate: Date): number => {
    if (!habit.startDate || !habit.frequency) return 0;

    const startDate = startOfDay(parseISO(habit.startDate));
    const effectiveEndDate = startOfDay(selectedDate);
    
    // Si la fecha de inicio del hábito es estrictamente posterior a la fecha de cálculo, no hay progreso.
    if (isAfter(startDate, effectiveEndDate)) {
        return 0;
    }
    
    const logsForHabit = logs.filter(log => log.habitTaskId === habit.id);
    const completedLogsUpToEffectiveDate = logsForHabit.filter(l => !isAfter(startOfDay(parseISO(l.completion_date)), effectiveEndDate));

    let totalCompletions = completedLogsUpToEffectiveDate.length;
    let expectedCompletions = 0;

    switch (habit.frequency) {
        case 'daily':
            expectedCompletions = differenceInDays(effectiveEndDate, startDate) + 1;
            break;
        case 'weekly':
        case 'monthly':
            // Para semanales/mensuales, el progreso es binario: 100 si se hizo al menos una vez en el periodo actual, 0 si no.
            const startOfPeriod = habit.frequency === 'weekly' 
                ? startOfWeek(selectedDate, { weekStartsOn: 1 }) // Lunes
                : startOfMonth(selectedDate);
            const completionsInPeriod = logsForHabit.some(log => {
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, startOfPeriod) && !isAfter(logDate, selectedDate);
            });
            return completionsInPeriod ? 100 : 0;
        case 'specific_days':
            if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
            const dayMapping: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
            const targetDays = habit.frequencyDays.map(d => dayMapping[d]);
            
            let currentDate = new Date(startDate);
            while (!isAfter(currentDate, effectiveEndDate)) {
                if (targetDays.includes(currentDate.getDay())) {
                    expectedCompletions++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
        default:
            return 0;
    }
    
    if (expectedCompletions <= 0) return 100; // Si no se esperaba nada, se ha cumplido al 100%
    return Math.min((totalCompletions / expectedCompletions) * 100, 100);
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    const { data: habitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    const { data: allProgressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs')
        .select('*, habit_task_id');

    if (progressLogsError) throw new Error("Could not fetch progress logs.");
    
    const mappedProgressLogs: ProgressLog[] = allProgressLogsData.map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    }));

    // Logs de progreso filtrados HASTA la fecha seleccionada para el cálculo de progreso
    const progressLogsForCalculation = mappedProgressLogs.filter(log => !isAfter(startOfDay(parseISO(log.completion_date)), selectedDate));

    // Filtrar qué tareas se muestran en la UI para el día seleccionado
    const visibleHabitTasksData = habitTasksData.filter(ht => {
        const startDate = ht.start_date ? startOfDay(parseISO(ht.start_date)) : null;
        
        // No mostrar si la fecha de inicio es futura
        if (startDate && isAfter(startDate, selectedDate)) {
            return false;
        }

        // Si es una tarea, no mostrar si se completó en un día ANTERIOR al seleccionado
        if (ht.type === 'task' && ht.completion_date) {
            const completionDate = startOfDay(parseISO(ht.completion_date));
            if (isBefore(completionDate, selectedDate)) {
                return false;
            }
        }
    
        return true;
    });

    const habitTasks: HabitTask[] = visibleHabitTasksData.map((ht) => {
        const mappedHt = mapHabitTaskFromDb(ht);
        let progress = 0;

        if (mappedHt.type === 'task') {
             // El progreso es 100 si está completada EN o ANTES del día seleccionado.
             if (mappedHt.completionDate) {
                 const completionDate = startOfDay(parseISO(mappedHt.completionDate));
                 progress = !isAfter(completionDate, selectedDate) ? 100 : 0;
             } else {
                 progress = 0;
             }
        } else { // es 'habit'
             progress = calculateHabitProgress(mappedHt, progressLogsForCalculation, selectedDate);
        }

        let completedToday = false;
        if (mappedHt.type === 'task') {
            // Completada hoy si la fecha de finalización es exactamente el día seleccionado.
            completedToday = !!mappedHt.completionDate && isEqual(startOfDay(parseISO(mappedHt.completionDate)), selectedDate);
        } else {
            // Completada hoy si hay un log para el día seleccionado.
            completedToday = mappedProgressLogs.some(log => log.habitTaskId === ht.id && isEqual(startOfDay(parseISO(log.completion_date)), selectedDate));
        }

        return { ...mappedHt, progress, completedToday };
    });

    const areaPrks: AreaPrk[] = areaPrksData.map((ap) => {
        const relevantHabitTasks = habitTasks
            .filter(ht => ht.areaPrkId === ap.id);

        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + (ht.progress ?? 0), 0);
            progress = totalProgress / relevantHabitTasks.length;
        } else {
            // Si no hay tareas/hábitos, el progreso del área es 0 (o 100 si se quiere ver como "nada que hacer")
            progress = 0; 
        }

        return { 
            id: ap.id,
            lifePrkId: ap.life_prk_id,
            title: ap.title,
            targetValue: ap.target_value,
            currentValue: ap.current_value,
            unit: ap.unit,
            created_at: ap.created_at,
            archived: ap.archived,
            progress: progress
        };
    });

     const lifePrks: LifePrk[] = lifePrksData.map(lp => {
        const relevantAreaPrks = areaPrks.filter(ap => ap.lifePrkId === lp.id);
        let progress = 0;
        if (relevantAreaPrks.length > 0) {
            const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
            progress = totalProgress / relevantAreaPrks.length;
        }
        return { ...lp, archived: lp.archived || false, progress };
    });
    
    return { lifePrks, areaPrks, habitTasks };
}
