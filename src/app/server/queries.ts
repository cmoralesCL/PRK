'use server';

import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog, LifePrkProgressPoint, CalendarDataPoint, DailyProgressSnapshot } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, endOfDay, getDay, eachMonthOfInterval, getYear, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeRangeOption } from "../journal/page";

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
    weight: dbData.weight || 1,
    isCritical: dbData.is_critical,
    measurementGoal: dbData.measurement_goal,
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

const isTaskActiveOnDate = (task: HabitTask, selectedDate: Date): boolean => {
    if (task.type !== 'task' || !task.startDate) return false;

    const startDate = startOfDay(parseISO(task.startDate));

    // A task is not active if the selected date is before its start date.
    if (isBefore(selectedDate, startDate)) {
        return false;
    }

    // If task is already completed, it's active up to and including its completion day.
    // It becomes inactive the day after it's completed.
    if (task.completionDate) {
        const completionDate = startOfDay(parseISO(task.completionDate));
        return !isAfter(selectedDate, completionDate);
    }
    
    // If not completed, and it has a due date, it is inactive two days after the due date.
    if (task.dueDate) {
        const dueDate = startOfDay(parseISO(task.dueDate));
        const dayAfterDueDate = endOfDay(dueDate); // end of due date day
        const twoDaysAfterDueDate = new Date(dayAfterDueDate.getTime() + 24 * 60 * 60 * 1000); // 24h after end of due date
        if (isAfter(selectedDate, twoDaysAfterDueDate)) {
            return false;
        }
    }
    
    // Otherwise, it's active.
    return true;
}

const getHabitTasksForDate = (selectedDate: Date, allHabitTasks: HabitTask[], mappedProgressLogs: ProgressLog[]): HabitTask[] => {
    return allHabitTasks
        .filter(ht => {
            if (ht.archived) return false;
            if (ht.type === 'task') {
                return isTaskActiveOnDate(ht, selectedDate);
            }

            if (!ht.startDate) return false;
            const startDate = startOfDay(parseISO(ht.startDate));
            if (isAfter(startDate, selectedDate)) return false;

            if (ht.frequency === 'specific_days' && ht.frequencyDays) {
                const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                const selectedDayOfWeek = getDay(selectedDate);
                const requiredDays = ht.frequencyDays.map(day => dayOfWeekMap[day]);
                return requiredDays.includes(selectedDayOfWeek);
            }
            if (ht.frequency === 'weekly' || ht.frequency === 'monthly' || ht.frequency === 'daily') {
                return true;
            }
            
            return false;
        })
        .map(ht => {
            let completedToday = false;
            if (ht.type === 'task') {
                if (ht.completionDate && ht.startDate) {
                    const completionDay = startOfDay(parseISO(ht.completionDate));
                    const startDay = startOfDay(parseISO(ht.startDate));
                    completedToday = !isBefore(selectedDate, startDay) && !isAfter(selectedDate, completionDay);
                }
            } else if (ht.frequency === 'weekly') {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
                completedToday = mappedProgressLogs.some(log => {
                    if (!log.completion_date || log.habitTaskId !== ht.id) return false;
                    const logDate = startOfDay(parseISO(log.completion_date));
                    return !isBefore(logDate, weekStart) && !isAfter(logDate, weekEnd);
                });
            } else if (ht.frequency === 'monthly') {
                const monthStart = startOfMonth(selectedDate);
                const monthEnd = endOfMonth(selectedDate);
                completedToday = mappedProgressLogs.some(log => {
                    if (!log.completion_date || log.habitTaskId !== ht.id) return false;
                    const logDate = startOfDay(parseISO(log.completion_date));
                    return !isBefore(logDate, monthStart) && !isAfter(logDate, monthEnd);
                });
            } else { // daily or specific_days
                completedToday = mappedProgressLogs.some(log => 
                    log.habitTaskId === ht.id && 
                    log.completion_date && 
                    isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
                );
            }
            return { ...ht, completedToday };
        });
}

// Simplified function to fetch progress from snapshots
async function getProgressForDateRange(supabase: any, from: Date, to: Date): Promise<Map<string, number>> {
    const fromStr = format(from, 'yyyy-MM-dd');
    const toStr = format(to, 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('daily_progress_snapshots')
        .select('snapshot_date, progress')
        .gte('snapshot_date', fromStr)
        .lte('snapshot_date', toStr);
    
    if (error) {
        console.error("Error fetching daily progress snapshots:", error);
        return new Map();
    }

    const progressMap = new Map<string, number>();
    for (const snapshot of data) {
        progressMap.set(snapshot.snapshot_date, parseFloat(snapshot.progress) * 100);
    }
    return progressMap;
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult, dailySnapshotResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date').eq('completion_date', selectedDateStr),
        supabase.from('daily_progress_snapshots').select('progress').eq('snapshot_date', selectedDateStr).single()
    ]);

    const { data: lifePrksData, error: lifePrksError } = lifePrksResult;
    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = areaPrksResult;
    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    const { data: allHabitTasksData, error: habitTasksError } = allHabitTasksResult;
    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    const { data: allProgressLogsData, error: progressLogsError } = allProgressLogsResult;
    if (progressLogsError) throw new Error("Could not fetch progress logs for today.");

    const overallProgressToday = (dailySnapshotResult.data?.progress ?? 0) * 100;

    const allLifePrks = lifePrksData.map(mapLifePrkFromDb);
    const allAreaPrks = areaPrksData.map(mapAreaPrkFromDb);
    const allHabitTasks = allHabitTasksData.map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsData || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);
    
    // Note: The progress calculation is now simplified.
    // We are assigning the overall daily progress to each Life PRK for display simplicity.
    // A more granular approach would require storing progress per Life PRK in snapshots.
    const lifePrksWithProgress = allLifePrks.map(lp => ({
        ...lp,
        progress: overallProgressToday
    }));
    
    // Area PRK progress is not directly calculated here anymore.
    // For now, we leave it as undefined. A more complex snapshot would be needed.
    const areaPrksWithProgress = allAreaPrks.map(ap => ({
        ...ap,
        progress: null // Or fetch from a more granular snapshot if available
    }));

    const habitTasksForDisplay = getHabitTasksForDate(selectedDate, allHabitTasks, mappedProgressLogs);
    
    return { 
        lifePrks: lifePrksWithProgress, 
        areaPrks: areaPrksWithProgress, 
        habitTasks: habitTasksForDisplay 
    };
}


export async function getLifePrkProgressData(options: { from: Date; to: Date; timeRange: TimeRangeOption }): Promise<{ chartData: LifePrkProgressPoint[], lifePrkNames: Record<string, string> }> {
    const { from, to, timeRange } = options;

    const supabase = createClient();
    
    const { data: lifePrksData, error: lifePrksError } = await supabase.from('life_prks').select('id, title').eq('archived', false);
    if(lifePrksError) {
        console.error("Error fetching life PRKs for chart", lifePrksError);
        return { chartData: [], lifePrkNames: {} };
    }

    const allLifePrks = (lifePrksData || []).map(mapLifePrkFromDb);
    const lifePrkNames = allLifePrks.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    // Fetch pre-calculated progress from snapshots
    const progressMap = await getProgressForDateRange(supabase, from, to);

    const chartData: LifePrkProgressPoint[] = [];
    const intervalDays = eachDayOfInterval({ start: from, end: to });

    if (timeRange === '1y') {
        const monthlyData: { [key: string]: { sum: number, count: number } } = {};
        
        intervalDays.forEach(day => {
            const monthKey = format(day, 'MMM', { locale: es });
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { sum: 0, count: 0 };
            }
            const dayStr = format(day, 'yyyy-MM-dd');
            if (progressMap.has(dayStr)) {
                monthlyData[monthKey].sum += progressMap.get(dayStr)!;
                monthlyData[monthKey].count += 1;
            }
        });

        for (const monthKey in monthlyData) {
            const avgProgress = monthlyData[monthKey].count > 0 ? monthlyData[monthKey].sum / monthlyData[monthKey].count : 0;
            const dataPoint: LifePrkProgressPoint = { date: monthKey };
            // Assign the same overall progress to all life PRKs for the chart
            allLifePrks.forEach(lp => {
                dataPoint[lp.id] = avgProgress;
            });
            chartData.push(dataPoint);
        }

    } else {
        intervalDays.forEach(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const progress = progressMap.get(dayStr) ?? 0;
            const dataPoint: LifePrkProgressPoint = {
                date: format(day, 'MMM d', { locale: es }),
            };
             // Assign the same overall progress to all life PRKs for the chart
            allLifePrks.forEach(lp => {
                dataPoint[lp.id] = progress;
            });
            chartData.push(dataPoint);
        });
    }
    
    return { chartData, lifePrkNames };
}

export async function getCalendarData(date: Date): Promise<CalendarDataPoint[]> {
    const supabase = createClient();

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Fetch all necessary data in parallel
    const [allHabitTasksResult, allProgressLogsResult, dailySnapshotsResult] = await Promise.all([
        supabase.from('habit_tasks').select('*').eq('archived', false),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date')
            .gte('completion_date', format(startOfDay(monthStart), 'yyyy-MM-dd'))
            .lte('completion_date', format(endOfDay(monthEnd), 'yyyy-MM-dd')),
        supabase.from('daily_progress_snapshots').select('snapshot_date, progress')
            .gte('snapshot_date', format(startOfDay(monthStart), 'yyyy-MM-dd'))
            .lte('snapshot_date', format(endOfDay(monthEnd), 'yyyy-MM-dd')),
    ]);

    if (allHabitTasksResult.error || allProgressLogsResult.error || dailySnapshotsResult.error) {
        console.error("Error fetching data for calendar:", allHabitTasksResult.error || allProgressLogsResult.error || dailySnapshotsResult.error);
        return [];
    }

    const allHabitTasks = (allHabitTasksResult.data || []).map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsResult.data || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);
    
    const progressMap = new Map<string, number>();
    for (const snapshot of dailySnapshotsResult.data || []) {
        progressMap.set(snapshot.snapshot_date, parseFloat(snapshot.progress) * 100);
    }
    
    const intervalDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const calendarData: CalendarDataPoint[] = [];

    for (const day of intervalDays) {
        const dayStr = format(day, 'yyyy-MM-dd');
        const overallProgress = progressMap.get(dayStr) ?? 0;
        const tasksForDay = getHabitTasksForDate(day, allHabitTasks, mappedProgressLogs);

        calendarData.push({
            date: day.toISOString(),
            progress: overallProgress,
            tasks: tasksForDay
        });
    }

    return calendarData;
}
