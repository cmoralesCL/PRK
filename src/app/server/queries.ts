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
            let daysPassed = 0;
            while (!isAfter(currentDate, effectiveEndDate)) {
                if (targetDays.includes(currentDate.getDay())) {
                    daysPassed++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            expectedCompletions = daysPassed;
            break;
        default:
            return 0;
    }
    
    if (expectedCompletions <= 0) return 100; // Si no se esperaba nada, se asume 100%
    return Math.min((totalCompletions / expectedCompletions) * 100, 100);
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    // --- 1. Fetch all raw data ---
    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    const { data: allHabitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    const { data: allProgressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs').select('*, habit_task_id');
    if (progressLogsError) throw new Error("Could not fetch progress logs.");
    
    const mappedProgressLogs: ProgressLog[] = allProgressLogsData.map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    }));
    
    // --- 2. Calculate progress for ALL tasks/habits up to the selected date ---
    const allHabitTasksWithProgress: HabitTask[] = allHabitTasksData.map(ht => {
        const mappedHt = mapHabitTaskFromDb(ht);
        let progress = 0;
        
        const startDate = mappedHt.startDate ? startOfDay(parseISO(mappedHt.startDate)) : new Date(0);
        
        if (mappedHt.type === 'task') {
            const completionDate = mappedHt.completionDate ? startOfDay(parseISO(mappedHt.completionDate)) : null;
            // Task contributes 100% if it has been completed on or before the selected date
            progress = completionDate && !isAfter(completionDate, selectedDate) ? 100 : 0;
        } else { // It's a 'habit'
            // For habits, calculate progress based on logs up to the selected date, but only if it has started
             if (!isAfter(startDate, selectedDate)) {
                const progressLogsForCalculation = mappedProgressLogs.filter(log => !isAfter(startOfDay(parseISO(log.completion_date)), selectedDate));
                progress = calculateHabitProgress(mappedHt, progressLogsForCalculation, selectedDate);
             }
        }

        let completedToday = false;
        if (mappedHt.type === 'task' && mappedHt.completionDate) {
            completedToday = isEqual(startOfDay(parseISO(mappedHt.completionDate)), selectedDate);
        } else if (mappedHt.type === 'habit') {
            completedToday = mappedProgressLogs.some(log => log.habitTaskId === ht.id && isEqual(startOfDay(parseISO(log.completion_date)), selectedDate));
        }

        return { ...mappedHt, progress, completedToday };
    });

    // --- 3. Calculate Area PRK and Life PRK progress based on their children active on the selected date ---
    const areaPrks: AreaPrk[] = areaPrksData.map(ap => {
        // Filter tasks that are relevant for progress calculation on the selected date
        const relevantHabitTasks = allHabitTasksWithProgress.filter(ht => {
            if (ht.areaPrkId !== ap.id) return false;
            const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            // Include the task in calculation only if its start date is on or before the selected date
            return !isAfter(startDate, selectedDate);
        });
        
        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + (ht.progress ?? 0), 0);
            progress = totalProgress / relevantHabitTasks.length;
        }

        return { 
            id: ap.id, lifePrkId: ap.life_prk_id, title: ap.title, targetValue: ap.target_value,
            currentValue: ap.current_value, unit: ap.unit, created_at: ap.created_at,
            archived: ap.archived, progress: progress
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

    // --- 4. Filter the list of tasks to be DISPLAYED in the UI ---
    const habitTasksForDisplay = allHabitTasksWithProgress.filter(ht => {
        const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : null;
        
        // Don't show if the start date is in the future
        if (startDate && isAfter(startDate, selectedDate)) {
            return false;
        }

        // For tasks, don't show if they were completed on a day BEFORE the selected date
        if (ht.type === 'task' && ht.completionDate) {
            const completionDate = startOfDay(parseISO(ht.completionDate));
            if (isBefore(completionDate, selectedDate)) {
                return false;
            }
        }
    
        return true;
    });
    
    return { lifePrks, areaPrks, habitTasks: habitTasksForDisplay };
}
