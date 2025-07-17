import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';

// Helper to map snake_case to camelCase
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

const mapAreaPrkFromDb = (dbData: any): AreaPrk => ({
    id: dbData.id,
    lifePrkId: dbData.life_prk_id,
    title: dbData.title,
    targetValue: dbData.target_value,
    currentValue: dbData.current_value,
    unit: dbData.unit,
    created_at: dbData.created_at,
    archived: dbData.archived
});

const mapLifePrkFromDb = (dbData: any): LifePrk => ({
    id: dbData.id,
    title: dbData.title,
    description: dbData.description,
    created_at: dbData.created_at,
    archived: dbData.archived,
});

const calculateHabitProgress = (habit: HabitTask, logs: ProgressLog[], selectedDate: Date): number => {
    if (!habit.startDate || !habit.frequency) return 0;

    const startDate = startOfDay(parseISO(habit.startDate));
    if (isAfter(startDate, selectedDate)) return 0;
    
    switch (habit.frequency) {
        case 'daily': {
            const completedOnSelectedDate = logs.some(log => 
                log.habitTaskId === habit.id && 
                log.completion_date && 
                isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
            return completedOnSelectedDate ? 100 : 0;
        }
        case 'weekly': {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
            
            const completionInWeek = logs.some(log => {
                if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, weekStart) && !isAfter(logDate, weekEnd);
            });

            return completionInWeek ? 100 : 0;
        }
        case 'monthly': {
             const monthStart = startOfMonth(selectedDate);
             const completionInMonth = logs.some(log => {
                 if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                 const logDate = startOfDay(parseISO(log.completion_date));
                 return !isBefore(logDate, monthStart) && !isAfter(logDate, selectedDate);
             });
             return completionInMonth ? 100 : 0;
        }
        case 'specific_days': {
             if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
             const completedOnDay = logs.some(log => 
                log.habitTaskId === habit.id && 
                log.completion_date && 
                isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
             return completedOnDay ? 100 : 0;
        }
        default:
            return 0;
    }
}

export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    // --- 1. Fetch all raw data in parallel ---
    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date')
    ]);

    const { data: lifePrksData, error: lifePrksError } = lifePrksResult;
    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = areaPrksResult;
    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    const { data: allHabitTasksData, error: habitTasksError } = allHabitTasksResult;
    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");

    const { data: allProgressLogsData, error: progressLogsError } = allProgressLogsResult;
    if (progressLogsError) throw new Error("Could not fetch progress logs.");

    // --- 2. Map and pre-process data ---
    const allHabitTasks = allHabitTasksData.map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = allProgressLogsData.map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);

    // --- 3. Calculate progress for all items ---
    const allHabitTasksWithProgress = allHabitTasks.map(ht => {
        let progress = 0;
        if (ht.type === 'task') {
            const completionDate = ht.completionDate ? startOfDay(parseISO(ht.completionDate)) : null;
            progress = completionDate && !isAfter(completionDate, selectedDate) ? 100 : 0;
        } else {
            progress = calculateHabitProgress(ht, mappedProgressLogs, selectedDate);
        }
        return { ...ht, progress };
    });

    const areaPrksWithProgress = areaPrksData.map(apDb => {
        const ap = mapAreaPrkFromDb(apDb);
        const relevantHabitTasks = allHabitTasksWithProgress.filter(ht => {
            const htStartDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            return ht.areaPrkId === ap.id && !isAfter(htStartDate, selectedDate);
        });
        
        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + ht.progress, 0);
            progress = totalProgress / relevantHabitTasks.length;
        } else {
            progress = 100; // No relevant tasks means the area is complete for the day
        }
        
        return { ...ap, progress };
    });

    const lifePrksWithProgress = lifePrksData.map(lpDb => {
        const lp = mapLifePrkFromDb(lpDb);
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.lifePrkId === lp.id);
        
        let progress = 0;
        if (relevantAreaPrks.length > 0) {
            const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
            progress = totalProgress / relevantAreaPrks.length;
        } else {
            progress = 100; // No relevant areas means the vision is complete
        }
        
        return { ...lp, progress };
    });

    // --- 4. Filter tasks for display ---
    const completedHabitIdsToday = new Set(
        mappedProgressLogs
            .filter(p => isEqual(startOfDay(parseISO(p.completion_date)), selectedDate))
            .map(p => p.habitTaskId)
    );

    const habitTasksForDisplay = allHabitTasks
        .filter(ht => {
            const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            return !isAfter(startDate, selectedDate);
        })
        .map(ht => {
            let completedToday = false;
            if (ht.type === 'task') {
                completedToday = ht.completionDate ? !isAfter(startOfDay(parseISO(ht.completionDate)), selectedDate) : false;
            } else {
                completedToday = completedHabitIdsToday.has(ht.id);
            }
            return { ...ht, completedToday };
        })
        .filter(ht => {
             if (ht.type === 'task' && ht.completionDate) {
                 return isAfter(startOfDay(parseISO(ht.completionDate)), selectedDate) || isEqual(startOfDay(parseISO(ht.completionDate)), selectedDate)
             }
             return true;
        });
    
    return { 
        lifePrks: lifePrksWithProgress, 
        areaPrks: areaPrksWithProgress, 
        habitTasks: habitTasksForDisplay 
    };
}
