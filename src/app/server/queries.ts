import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfWeek, startOfMonth, differenceInDays, isAfter, isToday, parseISO } from 'date-fns';


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

    const startDate = parseISO(habit.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Si la fecha de inicio del hábito es estrictamente posterior a hoy, no hay progreso.
    if (isAfter(startDate, today)) {
        return 0;
    }
    
    const logsForHabit = logs.filter(log => log.habitTaskId === habit.id);

    let totalCompletions = 0;
    let expectedCompletions = 0;
    
    // La fecha efectiva para el cálculo de "esperados" no debe superar el día de hoy real.
    const effectiveEndDate = isAfter(selectedDate, today) ? today : selectedDate;

    // Si la fecha de inicio del hábito está después de la fecha efectiva de fin, no hay nada que calcular.
    if (isAfter(startDate, effectiveEndDate)) {
        return 0;
    }


    switch (habit.frequency) {
        case 'daily':
            expectedCompletions = differenceInDays(effectiveEndDate, startDate) + 1;
            totalCompletions = logsForHabit.filter(l => parseISO(l.completion_date) <= effectiveEndDate).length;
            break;
        case 'weekly':
            const startOfThisWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lunes
            const completionsThisWeek = logsForHabit.filter(log => parseISO(log.completion_date) >= startOfThisWeek && parseISO(log.completion_date) <= selectedDate).length;
            return completionsThisWeek > 0 ? 100 : 0;
        case 'monthly':
            const startOfThisMonth = startOfMonth(selectedDate);
            const completionsThisMonth = logsForHabit.filter(log => parseISO(log.completion_date) >= startOfThisMonth && parseISO(log.completion_date) <= selectedDate).length;
            return completionsThisMonth > 0 ? 100 : 0;
        case 'specific_days':
            if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
            const dayMapping: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
            const targetDays = habit.frequencyDays.map(d => dayMapping[d]);
            
            let currentDate = new Date(startDate);
            while (currentDate <= effectiveEndDate) {
                if (targetDays.includes(currentDate.getDay())) {
                    expectedCompletions++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            totalCompletions = logsForHabit.filter(l => parseISO(l.completion_date) <= effectiveEndDate).length;
            break;
        default:
            return 0;
    }
    
    if (expectedCompletions <= 0) return 0; 
    return Math.min((totalCompletions / expectedCompletions) * 100, 100);
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = parseISO(selectedDateStr);

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
    
    const mappedProgressLogs = allProgressLogsData.map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    }));

    const visibleHabitTasksData = habitTasksData.filter(ht => {
        // Regla de inicio: Ocultar si la fecha de inicio es futura.
        if (ht.start_date && ht.start_date > selectedDateStr) {
            return false;
        }

        // Regla de finalización para tareas: Ocultar si la tarea está completada y estamos viendo un día POSTERIOR a su finalización.
        if (ht.type === 'task' && ht.completion_date) {
            if (selectedDateStr > ht.completion_date) {
                return false;
            }
        }
    
        return true;
    });

    // Logs de progreso filtrados HASTA la fecha seleccionada para el cálculo de progreso
    const progressLogsForCalculation = mappedProgressLogs.filter(log => log.completion_date <= selectedDateStr);

    const habitTasks: HabitTask[] = visibleHabitTasksData.map((ht) => {
        let progress = 0;
        const mappedHt = mapHabitTaskFromDb(ht);

        if (mappedHt.type === 'task') {
             // El progreso se basa en si tiene fecha de finalización o no.
             progress = mappedHt.completionDate ? 100 : 0;
        } else { // es 'habit'
             progress = calculateHabitProgress(mappedHt, progressLogsForCalculation, selectedDate);
        }

        let completedToday = false;
        if (mappedHt.type === 'task') {
            completedToday = !!mappedHt.completionDate && mappedHt.completionDate === selectedDateStr;
        } else {
            completedToday = progressLogsForCalculation.some(log => log.habitTaskId === ht.id && log.completion_date === selectedDateStr);
        }

        return { ...mappedHt, progress, completedToday };
    });

    const areaPrks: AreaPrk[] = areaPrksData.map((ap) => {
        const relevantHabitTasks = habitTasksData
            .filter(ht => ht.area_prk_id === ap.id)
            .map(ht => {
                let progress = 0;
                const mappedHt = mapHabitTaskFromDb(ht);
                 if (mappedHt.type === 'task') {
                    // Una tarea o está completa (100) o no (0).
                    progress = mappedHt.completionDate ? 100 : 0;
                } else {
                    // El progreso del hábito SÍ depende de la fecha seleccionada.
                    progress = calculateHabitProgress(mappedHt, progressLogsForCalculation, selectedDate);
                }
                return {...mappedHt, progress};
            });

        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + (ht.progress ?? 0), 0);
            progress = totalProgress / relevantHabitTasks.length;
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
