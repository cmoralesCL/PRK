import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfDay, parseISO, isAfter, isEqual, isBefore, startOfMonth, startOfWeek } from 'date-fns';

// Helper to map snake_case to camelCase for HabitTask
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
    
    const mappedProgressLogs: ProgressLog[] = allProgressLogsData
        .map(p => ({
            id: p.id,
            habitTaskId: p.habit_task_id,
            completion_date: p.completion_date,
        }))
        .filter(p => p.completion_date && !isAfter(startOfDay(parseISO(p.completion_date)), selectedDate));


    // --- 2. Calculate progress for all items for the selectedDate ---
    
    const allHabitTasksWithProgress: HabitTask[] = allHabitTasksData.map(ht => {
        const mappedHt = mapHabitTaskFromDb(ht);
        let progress = 0;
        
        // Only calculate progress for tasks/habits that have already started
        const startDate = mappedHt.startDate ? startOfDay(parseISO(mappedHt.startDate)) : null;
        if (startDate && isAfter(startDate, selectedDate)) {
             return { ...mappedHt, progress: 0, completedToday: false };
        }

        if (mappedHt.type === 'task') {
            const completionDate = mappedHt.completionDate ? startOfDay(parseISO(mappedHt.completionDate)) : null;
            progress = completionDate && !isAfter(completionDate, selectedDate) ? 100 : 0;
        } else {
            progress = calculateHabitProgress(mappedHt, mappedProgressLogs, selectedDate);
        }

        const completedToday = mappedHt.type === 'task'
            ? mappedHt.completionDate ? isEqual(startOfDay(parseISO(mappedHt.completionDate)), selectedDate) : false
            : mappedProgressLogs.some(log => log.habitTaskId === ht.id && log.completion_date && isEqual(startOfDay(parseISO(log.completion_date)), selectedDate));

        return { ...mappedHt, progress, completedToday };
    });

    const areaPrksWithProgress: AreaPrk[] = areaPrksData.map(ap => {
        const relevantHabitTasks = allHabitTasksWithProgress.filter(ht => {
             const htStartDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : null;
             if (!htStartDate || isAfter(htStartDate, selectedDate)) {
                 return false;
             }
             return ht.areaPrkId === ap.id;
        });

        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + (ht.progress ?? 0), 0);
            progress = totalProgress / relevantHabitTasks.length;
        } else {
            progress = 100; // No tasks or habits means 100% complete for the day
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
            progress,
        };
    });

    const lifePrksWithProgress: LifePrk[] = lifePrksData.map(lp => {
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.lifePrkId === lp.id);
        let progress = 0;
        if (relevantAreaPrks.length > 0) {
            const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
            progress = totalProgress / relevantAreaPrks.length;
        }
        return {
            ...lp,
            archived: lp.archived || false,
            progress,
        };
    });

    // --- 3. Filter the list of tasks to be DISPLAYED in the UI ---
    const habitTasksForDisplay = allHabitTasksWithProgress.filter(ht => {
        const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : null;
        if (!startDate) return true;
        if (isAfter(startDate, selectedDate)) return false;

        if (ht.type === 'task' && ht.completionDate) {
            const completionDate = startOfDay(parseISO(ht.completionDate));
            // Hide if it was completed on a day before the selected date
            if (isBefore(completionDate, selectedDate)) {
                return false;
            }
        }
    
        return true;
    });
    
    return { lifePrks: lifePrksWithProgress, areaPrks: areaPrksWithProgress, habitTasks: habitTasksForDisplay };
}


const calculateHabitProgress = (habit: HabitTask, logs: ProgressLog[], selectedDate: Date): number => {
    if (!habit.startDate || !habit.frequency) return 0;

    const startDate = startOfDay(parseISO(habit.startDate));
    
    if (isAfter(startDate, selectedDate)) {
        return 0;
    }
    
    const logsForHabit = logs.filter(log => log.habitTaskId === habit.id);
    
    switch (habit.frequency) {
        case 'daily':
            const completedOnSelectedDate = logsForHabit.some(log => 
                log.completion_date && isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
            return completedOnSelectedDate ? 100 : 0;
        case 'weekly':
        case 'monthly':
            const startOfPeriodFn = (date: Date) => {
                if (habit.frequency === 'monthly') return startOfMonth(date);
                // Semanal
                return startOfWeek(date, { weekStartsOn: 1 }); // Lunes
            }
            const startOfPeriod = startOfPeriodFn(selectedDate);

            const completionsInPeriod = logsForHabit.some(log => {
                if (!log.completion_date) return false;
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, startOfPeriod) && !isAfter(logDate, selectedDate);
            });
            return completionsInPeriod ? 100 : 0;
        case 'specific_days':
             if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
            const completedLogsUpToEffectiveDate = logs.filter(l => l.habitTaskId === habit.id && l.completion_date && !isAfter(startOfDay(parseISO(l.completion_date)), selectedDate));
            let totalCompletions = completedLogsUpToEffectiveDate.length;
            const dayMapping: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
            const targetDays = habit.frequencyDays.map(d => dayMapping[d]);
            
            let currentDate = new Date(startDate);
            let expectedCompletions = 0;
            while (!isAfter(currentDate, selectedDate)) {
                if (targetDays.includes(currentDate.getDay())) {
                    expectedCompletions++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            if (expectedCompletions <= 0) return 0;
            return Math.min((totalCompletions / expectedCompletions) * 100, 100);
        default:
            return 0;
    }
}
