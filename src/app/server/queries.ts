import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfWeek, startOfMonth, endOfMonth, differenceInDays, isSameDay } from 'date-fns';


// Helper para mapear snake_case a camelCase para HabitTask
const mapHabitTaskFromDb = (dbData: any): HabitTask => ({
    id: dbData.id,
    areaPrkId: dbData.area_prk_id,
    title: dbData.title,
    type: dbData.type,
    created_at: dbData.created_at,
    archived: dbData.archived,
    startDate: dbData.start_date,
    frequency: dbData.frequency,
    frequencyDays: dbData.frequency_days,
    weight: dbData.weight,
});

const calculateHabitProgress = (habit: HabitTask, logs: ProgressLog[], selectedDate: Date): number => {
    if (!habit.startDate || !habit.frequency) return 0;

    const startDate = new Date(habit.startDate);
    
    // Si la fecha de inicio del hábito es posterior a la fecha seleccionada, el progreso es 0.
    if (startDate > selectedDate) return 0;

    const logsForHabit = logs.filter(log => log.habit_task_id === habit.id && new Date(log.completion_date) <= selectedDate);

    let totalCompletions = 0;
    let expectedCompletions = 0;

    switch (habit.frequency) {
        case 'daily':
            expectedCompletions = differenceInDays(selectedDate, startDate) + 1;
            totalCompletions = logsForHabit.length;
            break;
        case 'weekly':
            const startOfThisWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Lunes
            const completionsThisWeek = logsForHabit.filter(log => new Date(log.completion_date) >= startOfThisWeek).length;
            return completionsThisWeek > 0 ? 100 : 0; // Simple check for this week
        case 'monthly':
            const startOfThisMonth = startOfMonth(selectedDate);
            const completionsThisMonth = logsForHabit.filter(log => new Date(log.completion_date) >= startOfThisMonth).length;
            return completionsThisMonth > 0 ? 100 : 0; // Simple check for this month
        case 'specific_days':
            if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
            const dayMapping: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
            const targetDays = habit.frequencyDays.map(d => dayMapping[d]);
            
            let currentDate = new Date(startDate);
            while (currentDate <= selectedDate) {
                if (targetDays.includes(currentDate.getDay())) {
                    expectedCompletions++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            totalCompletions = logsForHabit.length;
            break;
        default:
            return 0;
    }
    
    if (expectedCompletions === 0) return 0;
    return Math.min((totalCompletions / expectedCompletions) * 100, 100);
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = new Date(selectedDateStr);

    // 1. Obtener los PRK de Vida no archivados
    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    // 2. Obtener los PRK de Área no archivados
    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    // 3. Obtener los Hábitos/Tareas no archivados
    const { data: habitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    // 4. Obtener todos los registros de progreso hasta la fecha seleccionada
    const { data: progressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs')
        .select('*')
        .lte('completion_date', selectedDateStr);


    if (progressLogsError) throw new Error("Could not fetch progress logs.");

    const completedTaskIds = new Set(
        progressLogsData
            .map(log => {
                const task = habitTasksData.find(ht => ht.id === log.habit_task_id);
                return task?.type === 'task' ? task.id : null;
            })
            .filter(id => id !== null)
    );

    const visibleHabitTasksData = habitTasksData.filter(ht => {
        if (ht.type === 'task') {
            return !completedTaskIds.has(ht.id);
        }
        return true;
    });


    // 5. Calcular progreso para cada nivel

    // 5a. Calcular progreso para Hábitos y Tareas
    const habitTasks: HabitTask[] = visibleHabitTasksData.map((ht) => {
        let progress = 0;
        const mappedHt = mapHabitTaskFromDb(ht);

        if (mappedHt.type === 'task') {
             const completed = progressLogsData.some(log => log.habit_task_id === mappedHt.id);
             progress = completed ? 100 : 0;
        } else {
             progress = calculateHabitProgress(mappedHt, progressLogsData, selectedDate);
        }

        const completedToday = progressLogsData.some(log => log.habit_task_id === ht.id && log.completion_date === selectedDateStr);

        return { ...mappedHt, progress, completedToday };
    });

    // 5b. Calcular progreso para PRK de Área
    const areaPrks: AreaPrk[] = areaPrksData.map((ap) => {
        const relevantHabitTasks = habitTasksData
            .filter(ht => ht.area_prk_id === ap.id)
            .map(ht => {
                let progress = 0;
                const mappedHt = mapHabitTaskFromDb(ht);
                 if (mappedHt.type === 'task') {
                    const completed = progressLogsData.some(log => log.habit_task_id === mappedHt.id);
                    progress = completed ? 100 : 0;
                } else {
                    progress = calculateHabitProgress(mappedHt, progressLogsData, selectedDate);
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

    // 5c. Calcular progreso para PRK de Vida (basado en el promedio de sus PRK de Área)
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
