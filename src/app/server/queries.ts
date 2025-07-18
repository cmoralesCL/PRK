'use server';

import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog, LifePrkProgressPoint, CalendarDataPoint } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, endOfDay, getDay, eachMonthOfInterval, getMonth, getYear, lastDayOfMonth } from 'date-fns';
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
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });   // Sunday

            const completionInWeek = logs.some(log => {
                if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, weekStart) && !isAfter(logDate, weekEnd);
            });
            return completionInWeek ? 100 : 0;
        }
        case 'monthly': {
             const monthStart = startOfMonth(selectedDate);
             const monthEnd = endOfMonth(selectedDate); 
             const completionInMonth = logs.some(log => {
                 if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                 const logDate = startOfDay(parseISO(log.completion_date));
                 return !isBefore(logDate, monthStart) && !isAfter(logDate, monthEnd);
             });
             return completionInMonth ? 100 : 0;
        }
        case 'specific_days': {
             if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
             const selectedDayOfWeek = getDay(selectedDate); // Sunday is 0, Monday is 1...
             const requiredDays = habit.frequencyDays.map(day => dayOfWeekMap[day]);
             if (!requiredDays.includes(selectedDayOfWeek)) {
                const habitStartDate = startOfDay(parseISO(habit.startDate!));
                return isAfter(habitStartDate, selectedDate) ? 0 : 100;
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

const isTaskActiveOnDate = (task: HabitTask, selectedDate: Date): boolean => {
    if (task.type !== 'task' || !task.startDate) return false;

    const startDate = startOfDay(parseISO(task.startDate));
    if (isAfter(startDate, selectedDate)) {
        return false;
    }
    
    // Si la tarea tiene fecha de vencimiento y ya pasó, solo está activa si se completó en el día seleccionado.
    if (task.dueDate) {
        const dueDate = startOfDay(parseISO(task.dueDate));
         if (isBefore(selectedDate, startDate) || isAfter(selectedDate, dueDate)) {
             return false;
         }
    }
    
    return true;
}

async function calculateProgressForDate(selectedDate: Date, allLifePrks: LifePrk[], allAreaPrks: AreaPrk[], allHabitTasks: HabitTask[], mappedProgressLogs: ProgressLog[]) {
    const habitTasksForDay = getHabitTasksForDate(selectedDate, allHabitTasks, mappedProgressLogs);
    const habitTaskIdsForDay = new Set(habitTasksForDay.map(ht => ht.id));

    const areaPrksWithProgress = allAreaPrks.map(ap => {
        const relevantHabitsAndTasks = allHabitTasks.filter(ht => {
            if (ht.areaPrkId !== ap.id) return false;
            
            if (ht.type === 'task') {
                return isTaskActiveOnDate(ht, selectedDate);
            }

            // Para hábitos, comprobamos si el día es un día activo para el hábito.
            if (!ht.startDate || isAfter(startOfDay(parseISO(ht.startDate)), selectedDate)) return false;

            switch(ht.frequency) {
                case 'daily': return true;
                case 'weekly': return true;
                case 'monthly': return true;
                case 'specific_days': {
                     if (!ht.frequencyDays || ht.frequencyDays.length === 0) return false;
                     const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                     const selectedDayOfWeek = getDay(selectedDate);
                     const requiredDays = ht.frequencyDays.map(day => dayOfWeekMap[day]);
                     return requiredDays.includes(selectedDayOfWeek);
                }
                default: return false;
            }
        });

        if (relevantHabitsAndTasks.length === 0) {
            return { ...ap, progress: null }; // No hay tareas o hábitos medibles para este día.
        }

        const totalProgress = relevantHabitsAndTasks.reduce((sum, item) => {
            if (item.type === 'task') {
                const isCompleted = !!item.completionDate && !isAfter(startOfDay(parseISO(item.completionDate)), selectedDate);
                return sum + (isCompleted ? 100 : 0);
            }
            // Solo los habitos que están en `habitTasksForDay` (es decir, activos) se usan para el progreso.
            return sum + calculateHabitProgress(item, mappedProgressLogs, selectedDate);
        }, 0);
        
        const progress = totalProgress / relevantHabitsAndTasks.length;
        
        return { ...ap, progress };
    });

    const lifePrksWithProgress = allLifePrks.map(lp => {
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => 
            ap.lifePrkId === lp.id && ap.progress !== null
        );
        
        let progress = 0;
        if (relevantAreaPrks.length > 0) {
            const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
            progress = totalProgress / relevantAreaPrks.length;
        }
        
        return { ...lp, progress };
    });

    const allHabitTasksWithProgress = allHabitTasks.map(ht => ({
        ...ht,
        progress: calculateHabitProgress(ht, mappedProgressLogs, selectedDate)
    }))

    return { lifePrksWithProgress, areaPrksWithProgress: areaPrksWithProgress.map(ap => ({...ap, progress: ap.progress})), allHabitTasksWithProgress };
}


const getHabitTasksForDate = (selectedDate: Date, allHabitTasks: HabitTask[], mappedProgressLogs: ProgressLog[]): HabitTask[] => {
    return allHabitTasks
        .filter(ht => {
            if (!ht.startDate) return false;
            const startDate = startOfDay(parseISO(ht.startDate));
            if (isAfter(startDate, selectedDate)) return false;

            if (ht.type === 'task') {
                return isTaskActiveOnDate(ht, selectedDate);
            }

            if (ht.frequency === 'specific_days' && ht.frequencyDays) {
                const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                const selectedDayOfWeek = getDay(selectedDate);
                const requiredDays = ht.frequencyDays.map(day => dayOfWeekMap[day]);
                return requiredDays.includes(selectedDayOfWeek);
            }
            if (ht.frequency === 'weekly') {
                return true;
            }
            if(ht.frequency === 'monthly') {
                return true;
            }
            if(ht.frequency === 'daily') {
                return true;
            }
            
            return false;
        })
        .map(ht => {
            let completedToday = false;
            if (ht.type === 'task') {
                completedToday = !!ht.completionDate && isEqual(startOfDay(parseISO(ht.completionDate)), selectedDate);
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

export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

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
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsData || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);


    const { lifePrksWithProgress, areaPrksWithProgress } = await calculateProgressForDate(selectedDate, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
    
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

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('id, title').eq('archived', false),
        supabase.from('area_prks').select('*').eq('archived', false),
        supabase.from('habit_tasks').select('*').eq('archived', false),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date')
    ]);

    if (lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error) {
        console.error("Error fetching data for chart:", lifePrksResult.error || areaPrksResult.error || allHabitTasksResult.error || allProgressLogsResult.error);
        return { chartData: [], lifePrkNames: {} };
    }

    const allLifePrks = (lifePrksResult.data || []).map(mapLifePrkFromDb);
    const allAreaPrks = (areaPrksResult.data || []).map(mapAreaPrkFromDb);
    const allHabitTasks = (allHabitTasksResult.data || []).map(mapHabitTaskFromDb);
    const mappedProgressLogs: ProgressLog[] = (allProgressLogsResult.data || []).map(p => ({
        id: p.id,
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);

    const lifePrkNames = allLifePrks.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    const chartData: LifePrkProgressPoint[] = [];

    if (timeRange === '1y') {
        const intervalMonths = eachMonthOfInterval({ start: from, end: to });
        for (const monthStart of intervalMonths) {
            const monthEnd = lastDayOfMonth(monthStart);
            const { lifePrksWithProgress } = await calculateProgressForDate(monthEnd, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
            const dataPoint: LifePrkProgressPoint = {
                date: format(monthStart, 'MMM', { locale: es }),
            };
            lifePrksWithProgress.forEach(lp => {
                dataPoint[lp.id] = lp.progress ?? 0;
            });
            chartData.push(dataPoint);
        }
    } else {
        const intervalDays = eachDayOfInterval({ start: from, end: to });
        for (const day of intervalDays) {
            const { lifePrksWithProgress } = await calculateProgressForDate(day, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
            const dataPoint: LifePrkProgressPoint = {
                date: format(day, 'MMM d', { locale: es }),
            };
            lifePrksWithProgress.forEach(lp => {
                dataPoint[lp.id] = lp.progress ?? 0;
            });
            chartData.push(dataPoint);
        }
    }
    
    return { chartData, lifePrkNames };
}

export async function getCalendarData(currentDate: Date): Promise<CalendarDataPoint[]> {
    const supabase = createClient();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const [lifePrksResult, areaPrksResult, allHabitTasksResult, allProgressLogsResult] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false),
        supabase.from('area_prks').select('*').eq('archived', false),
        supabase.from('habit_tasks').select('*').eq('archived', false),
        supabase.from('progress_logs').select('id, habit_task_id, completion_date')
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
    })).filter(p => p.completion_date);

    const intervalDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const calendarData: CalendarDataPoint[] = [];

    if (allLifePrks.length === 0) {
        return intervalDays.map(day => ({ date: day.toISOString(), progress: 0, tasks: [] }));
    }

    for (const day of intervalDays) {
        const { lifePrksWithProgress } = await calculateProgressForDate(day, allLifePrks, allAreaPrks, allHabitTasks, mappedProgressLogs);
        
        const totalProgress = lifePrksWithProgress.reduce((sum, lp) => sum + (lp.progress ?? 0), 0);
        const overallProgress = lifePrksWithProgress.length > 0 ? totalProgress / lifePrksWithProgress.length : 0;
        
        const tasksForDay = getHabitTasksForDate(day, allHabitTasks, mappedProgressLogs);

        calendarData.push({
            date: day.toISOString(),
            progress: overallProgress,
            tasks: tasksForDay
        });
    }

    return calendarData;
}
