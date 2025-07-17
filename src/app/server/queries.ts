import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog, LifePrkProgressPoint } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, eachDayOfInterval, format } from 'date-fns';

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
    if (!habit.startDate) return 0;
    
    const startDate = startOfDay(parseISO(habit.startDate));
    if (isAfter(startDate, selectedDate)) return 0;

    const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

    switch (habit.frequency) {
        case 'daily': {
            const completedOnDay = logs.some(log => 
                log.habitTaskId === habit.id && 
                log.completion_date && 
                isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
            return completedOnDay ? 100 : 0;
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
             const selectedDayOfWeek = selectedDate.getDay();
             const requiredDays = habit.frequencyDays.map(day => dayOfWeekMap[day]);
             if (!requiredDays.includes(selectedDayOfWeek)) {
                return 100; // Not a required day, so it doesn't hurt progress
             }
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

async function calculateProgressForDate(selectedDate: Date, allLifePrks: LifePrk[], allAreaPrks: AreaPrk[], allHabitTasks: HabitTask[], mappedProgressLogs: ProgressLog[]) {
    const allHabitTasksWithProgress = allHabitTasks
        .filter(ht => {
            const htStartDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            return !isAfter(htStartDate, selectedDate);
        })
        .map(ht => {
            let progress = 0;
            if (ht.type === 'task') {
                progress = ht.completionDate ? 100 : 0;
            } else {
                progress = calculateHabitProgress(ht, mappedProgressLogs, selectedDate);
            }
            return { ...ht, progress };
        });

    const areaPrksWithProgress = allAreaPrks.map(ap => {
        const relevantHabitTasks = allHabitTasksWithProgress.filter(ht => ht.areaPrkId === ap.id);
        
        let progress = 0;
        if (relevantHabitTasks.length > 0) {
            const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + ht.progress, 0);
            progress = totalProgress / relevantHabitTasks.length;
        } else {
            progress = 100;
        }
        
        return { ...ap, progress };
    });

    const lifePrksWithProgress = allLifePrks.map(lp => {
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.lifePrkId === lp.id);
        
        let progress = 0;
        if (relevantAreaPrks.length > 0) {
            const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
            progress = totalProgress / relevantAreaPrks.length;
        } else {
            progress = 100;
        }
        
        return { ...lp, progress };
    });

    return { lifePrksWithProgress, areaPrksWithProgress, allHabitTasksWithProgress };
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

    const allLifePrks = lifePrksData.map(mapLifePrkFromDb);
    const allAreaPrks = areaPrksData.map(mapAreaPrkFromDb);
    const allHabitTasks = allHabitTasksData.map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = allProgressLogsData.map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);


    const { lifePrksWithProgress, areaPrksWithProgress } = await calculateProgressForDate(selectedDate, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
    
    const completedHabitIdsToday = new Set(
        mappedProgressLogs
            .filter(p => isEqual(startOfDay(parseISO(p.completion_date)), selectedDate))
            .map(p => p.habitTaskId)
    );

    const habitTasksForDisplay = allHabitTasks
        .filter(ht => {
            const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            if (isAfter(startDate, selectedDate)) return false;

            if (ht.type === 'task') {
                return !ht.completionDate;
            }

            if (ht.frequency === 'specific_days' && ht.frequencyDays) {
                const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                const selectedDayOfWeek = selectedDate.getDay();
                const requiredDays = ht.frequencyDays.map(day => dayOfWeekMap[day]);
                return requiredDays.includes(selectedDayOfWeek);
            }
            
            return true;
        })
        .map(ht => {
            let completedToday = false;
            if (ht.type === 'task') {
                completedToday = !!ht.completionDate;
            } else {
                completedToday = completedHabitIdsToday.has(ht.id);
            }
            return { ...ht, completedToday };
        });
    
    return { 
        lifePrks: lifePrksWithProgress, 
        areaPrks: areaPrksWithProgress, 
        habitTasks: habitTasksForDisplay 
    };
}


export async function getLifePrkProgressData(dateRange?: { from: Date; to: Date; }): Promise<{ chartData: LifePrkProgressPoint[], lifePrkNames: Record<string, string> }> {
    if (!dateRange) {
        return { chartData: [], lifePrkNames: {} };
    }

    const supabase = createClient();

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('id, title').eq('archived', false),
        supabase.from('area_prks').select('id, life_prk_id').eq('archived', false),
        supabase.from('habit_tasks').select('*').eq('archived', false),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date').gte('completion_date', dateRange.from.toISOString().split('T')[0]).lte('completion_date', dateRange.to.toISOString().split('T')[0])
    ]);

    if (lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error) {
        console.error("Error fetching data for chart:", lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error);
        return { chartData: [], lifePrkNames: {} };
    }

    const allLifePrks = lifePrksResult.data!.map(mapLifePrkFromDb);
    const allAreaPrks = areaPrksResult.data!.map(mapAreaPrkFromDb);
    const allHabitTasks = allHabitTasksResult.data!.map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsResult.data || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);

    const lifePrkNames = allLifePrks.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    const intervalDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const chartData: LifePrkProgressPoint[] = [];

    for (const day of intervalDays) {
        const { lifePrksWithProgress } = await calculateProgressForDate(day, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
        const dataPoint: LifePrkProgressPoint = {
            date: format(day, 'MMM d', {  }),
        };
        lifePrksWithProgress.forEach(lp => {
            dataPoint[lp.id] = lp.progress ?? 0;
        });
        chartData.push(dataPoint);
    }
    
    return { chartData, lifePrkNames };
}