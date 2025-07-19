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

const calculateProgressForDate = (
    selectedDate: Date,
    allLifePrks: LifePrk[],
    allAreaPrks: AreaPrk[],
    allHabitTasks: HabitTask[],
    mappedProgressLogs: ProgressLog[]
) => {
    const habitTasksForDate = getHabitTasksForDate(selectedDate, allHabitTasks, mappedProgressLogs);

    const areaPrkProgressMap = new Map<string, { progress: number, activeTasksCount: number }>();
    const lifePrkProgressMap = new Map<string, { totalProgress: number; measuredAreaPrksCount: number }>();

    allAreaPrks.forEach(ap => {
        const tasksForArea = habitTasksForDate.filter(ht => ht.areaPrkId === ap.id);
        if (tasksForArea.length > 0) {
            const totalWeight = tasksForArea.reduce((sum, task) => sum + task.weight, 0);
            const completedWeight = tasksForArea.reduce((sum, task) => task.completedToday ? sum + task.weight : sum, 0);
            const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
            areaPrkProgressMap.set(ap.id, { progress, activeTasksCount: tasksForArea.length });
        } else {
            areaPrkProgressMap.set(ap.id, { progress: 0, activeTasksCount: 0 }); // Use 0 for progress if no active tasks
        }
    });

    allLifePrks.forEach(lp => {
        const areaPrksForLife = allAreaPrks.filter(ap => ap.lifePrkId === lp.id);
        let totalProgress = 0;
        let measuredAreaPrksCount = 0;
        
        areaPrksForLife.forEach(ap => {
            const areaProgressInfo = areaPrkProgressMap.get(ap.id);
            if (areaProgressInfo && areaProgressInfo.activeTasksCount > 0) {
                totalProgress += areaProgressInfo.progress;
                measuredAreaPrksCount++;
            }
        });

        const progress = measuredAreaPrksCount > 0 ? totalProgress / measuredAreaPrksCount : 0;
        lifePrkProgressMap.set(lp.id, { totalProgress: progress, measuredAreaPrksCount });
    });

    const lifePrksWithProgress = allLifePrks.map(lp => ({
        ...lp,
        progress: lifePrkProgressMap.get(lp.id)?.totalProgress ?? 0
    }));

    const areaPrksWithProgress = allAreaPrks.map(ap => ({
        ...ap,
        progress: areaPrkProgressMap.get(ap.id)?.activeTasksCount ?? 0 > 0 ? areaPrkProgressMap.get(ap.id)!.progress : null
    }));
    
    return { lifePrksWithProgress, areaPrksWithProgress, habitTasksForDate };
}

export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date, progress_value, completion_percentage')
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
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsData || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
        progressValue: p.progress_value,
        completionPercentage: p.completion_percentage,
    })).filter(p => p.completion_date);

    const { lifePrksWithProgress, areaPrksWithProgress, habitTasksForDate } = calculateProgressForDate(
        selectedDate,
        allLifePrks,
        allAreaPrks,
        allHabitTasks,
        mappedProgressLogs
    );
    
    return { lifePrks: lifePrksWithProgress, areaPrks: areaPrksWithProgress, habitTasks: habitTasksForDate };
}


export async function getLifePrkProgressData(options: { from: Date; to: Date; timeRange: TimeRangeOption }): Promise<{ chartData: LifePrkProgressPoint[], lifePrkNames: Record<string, string> }> {
    const { from, to, timeRange } = options;
    const supabase = createClient();

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date, progress_value, completion_percentage')
    ]);

    if(lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error) {
        console.error("Error fetching data for chart", lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error);
        return { chartData: [], lifePrkNames: {} };
    }

    const allLifePrks = (lifePrksResult.data || []).map(mapLifePrkFromDb);
    const allAreaPrks = (areaPrksResult.data || []).map(mapAreaPrkFromDb);
    const allHabitTasks = (allHabitTasksResult.data || []).map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsResult.data || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
        progressValue: p.progress_value,
        completionPercentage: p.completion_percentage,
    })).filter(p => p.completion_date);

    const lifePrkNames = allLifePrks.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    const chartData: LifePrkProgressPoint[] = [];
    const intervalDays = eachDayOfInterval({ start: from, end: to });
    
    // Helper to get all logs for a specific day
    const getLogsForDay = (date: Date, allLogs: ProgressLog[]) => {
        return allLogs.filter(log => log.completion_date && isEqual(startOfDay(parseISO(log.completion_date)), startOfDay(date)));
    };

    if (timeRange === '1y') {
        const monthlyAverages: { [key: string]: { [lifePrkId: string]: { totalProgress: number, daysCount: number } } } = {};
        const months = eachMonthOfInterval({ start: from, end: to });
        
        months.forEach(monthStart => {
            const monthKey = format(monthStart, 'MMM', { locale: es });
            monthlyAverages[monthKey] = {};
            allLifePrks.forEach(lp => {
                monthlyAverages[monthKey][lp.id] = { totalProgress: 0, daysCount: 0 };
            });

            const daysInMonth = eachDayOfInterval({ start: monthStart, end: lastDayOfMonth(monthStart) });
            daysInMonth.forEach(day => {
                const logsForDay = getLogsForDay(day, mappedProgressLogs);
                const { lifePrksWithProgress } = calculateProgressForDate(day, allLifePrks, allAreaPrks, allHabitTasks, logsForDay);
                lifePrksWithProgress.forEach(lp => {
                    if (lp.progress !== undefined) {
                        monthlyAverages[monthKey][lp.id].totalProgress += lp.progress;
                        monthlyAverages[monthKey][lp.id].daysCount++;
                    }
                });
            });
        });
        
        for (const monthKey in monthlyAverages) {
            const dataPoint: LifePrkProgressPoint = { date: monthKey };
            for(const lpId in monthlyAverages[monthKey]) {
                const { totalProgress, daysCount } = monthlyAverages[monthKey][lpId];
                dataPoint[lpId] = daysCount > 0 ? totalProgress / daysCount : 0;
            }
            chartData.push(dataPoint);
        }

    } else {
        intervalDays.forEach(day => {
            const logsForDay = getLogsForDay(day, mappedProgressLogs);
            const { lifePrksWithProgress } = calculateProgressForDate(day, allLifePrks, allAreaPrks, allHabitTasks, logsForDay);
            const dataPoint: LifePrkProgressPoint = {
                date: format(day, 'MMM d', { locale: es }),
            };
            lifePrksWithProgress.forEach(lp => {
                dataPoint[lp.id] = lp.progress ?? 0;
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
    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false),
        supabase.from('area_prks').select('*').eq('archived', false),
        supabase.from('habit_tasks').select('*').eq('archived', false),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date, progress_value, completion_percentage')
            .gte('completion_date', format(startOfDay(monthStart), 'yyyy-MM-dd'))
            .lte('completion_date', format(endOfDay(monthEnd), 'yyyy-MM-dd'))
    ]);
    
    if (lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error) {
        console.error("Error fetching data for calendar:", lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error);
        return [];
    }
    
    const allLifePrks = (lifePrksResult.data || []).map(mapLifePrkFromDb);
    const allAreaPrks = (areaPrksResult.data || []).map(mapAreaPrkFromDb);
    const allHabitTasks = (allHabitTasksResult.data || []).map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsResult.data || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
        progressValue: p.progress_value,
        completionPercentage: p.completion_percentage,
    })).filter(p => p.completion_date);
    
    const intervalDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const calendarData: CalendarDataPoint[] = [];

    for (const day of intervalDays) {
        const dayLogs = mappedProgressLogs.filter(log => log.completion_date && isEqual(startOfDay(parseISO(log.completion_date)), day));
        
        const { lifePrksWithProgress, habitTasksForDate } = calculateProgressForDate(
            day,
            allLifePrks,
            allAreaPrks,
            allHabitTasks,
            dayLogs
        );

        const overallProgress = lifePrksWithProgress.length > 0
            ? lifePrksWithProgress.reduce((sum, lp) => sum + (lp.progress ?? 0), 0) / lifePrksWithProgress.length
            : 0;

        calendarData.push({
            date: day.toISOString(),
            progress: overallProgress,
            tasks: habitTasksForDate
        });
    }

    return calendarData;
}
