'use server';

import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog, LifePrkProgressPoint, CalendarDataPoint, DailyProgressSnapshot } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, endOfDay, getDay, eachMonthOfInterval, getYear, lastDayOfMonth, subDays } from 'date-fns';
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
    if (task.type !== 'project' || !task.startDate) return false;

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

const getHabitTasksForDate = async (selectedDate: Date): Promise<HabitTask[]> => {
    const supabase = createClient();
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data: allHabitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (habitTasksError) throw habitTasksError;

    const allHabitTasks = allHabitTasksData.map(mapHabitTaskFromDb);

    // Fetch progress logs for the specific date range needed
    const { data: progressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs')
        .select('habit_task_id, completion_date')
        .gte('completion_date', format(subDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 1), 'yyyy-MM-dd'))
        .lte('completion_date', format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));

    if (progressLogsError) throw progressLogsError;
    
    const mappedProgressLogs = (progressLogsData || []).map(p => ({
        habitTaskId: p.habit_task_id,
        completion_date: p.completion_date,
    })).filter(p => p.completion_date);


    return allHabitTasks
        .filter(ht => {
            if (ht.archived) return false;
            if (ht.type === 'project') {
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
            if (ht.type === 'project') {
                if (ht.completionDate && ht.startDate) {
                     completedToday = isEqual(startOfDay(parseISO(ht.completionDate)), selectedDate);
                }
            } else { // 'habit'
                const logDateStr = selectedDate.toISOString().split('T')[0];
                if (ht.frequency === 'weekly') {
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
            }
            return { ...ht, completedToday };
        });
}

const getProgressForDate = async (date: Date) => {
    const supabase = createClient();
    const dateStr = format(date, 'yyyy-MM-dd');

    const { data: snapshot, error } = await supabase
        .from('daily_progress_snapshots')
        .select('progress')
        .eq('snapshot_date', dateStr)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error
        console.error("Error fetching daily snapshot:", error);
        return 0;
    }

    return snapshot ? (snapshot.progress || 0) * 100 : 0;
}


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));

    const [lifePrksResult, areaPrksResult, habitTasksForDate, overallProgress] = await Promise.all([
        supabase.from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        supabase.from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true }),
        getHabitTasksForDate(selectedDate),
        getProgressForDate(selectedDate)
    ]);
    
    const { data: lifePrksData, error: lifePrksError } = lifePrksResult;
    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = areaPrksResult;
    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    const allLifePrks = lifePrksData.map(mapLifePrkFromDb);
    const allAreaPrks = areaPrksData.map(mapAreaPrkFromDb);
    
    // Asignar progreso general a cada Life PRK (simplificado, ya que ahora es un snapshot)
    const lifePrksWithProgress = allLifePrks.map(lp => ({
        ...lp,
        progress: overallProgress
    }));

     // Aquí puedes decidir cómo mostrar el progreso de los Area PRK.
     // Podríamos hacer otra RPC o un cálculo simplificado en el cliente si es necesario.
     // Por ahora, lo dejamos como nulo.
    const areaPrksWithProgress = allAreaPrks.map(ap => ({
        ...ap,
        progress: null // El progreso detallado por área ya no se calcula aquí
    }));
    
    return { lifePrks: lifePrksWithProgress, areaPrks: areaPrksWithProgress, habitTasks: habitTasksForDate };
}


export async function getLifePrkProgressData(options: { from: Date; to: Date; timeRange: TimeRangeOption }): Promise<{ chartData: LifePrkProgressPoint[], lifePrkNames: Record<string, string> }> {
    const { from, to } = options;
    const supabase = createClient();

    const { data: lifePrksData, error: lifePrksError } = await supabase.from('life_prks').select('id, title').eq('archived', false);
    if(lifePrksError) throw lifePrksError;

    const lifePrkNames = lifePrksData.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    // Fetch snapshots for the date range
    const { data: snapshots, error: snapshotError } = await supabase
        .from('daily_progress_snapshots')
        .select('snapshot_date, progress')
        .gte('snapshot_date', format(from, 'yyyy-MM-dd'))
        .lte('snapshot_date', format(to, 'yyyy-MM-dd'));

    if (snapshotError) throw snapshotError;

    const progressMap = new Map<string, number>();
    (snapshots || []).forEach(s => {
        progressMap.set(s.snapshot_date, (s.progress || 0) * 100);
    });

    const chartData: LifePrkProgressPoint[] = [];
    const intervalDays = eachDayOfInterval({ start: from, end: to });

    // Para el gráfico, asumiremos que el snapshot de progreso es el mismo para todos los LifePRKs
    // ya que la nueva función RPC calcula un único valor diario.
    intervalDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const progress = progressMap.get(dateStr) ?? 0;
        const dataPoint: LifePrkProgressPoint = {
            date: format(day, 'MMM d', { locale: es }),
        };
        lifePrksData.forEach(lp => {
            dataPoint[lp.id] = progress;
        });
        chartData.push(dataPoint);
    });

    // Simplificación para '1y': promedio mensual (si se necesita, si no, se puede quitar)
    if (options.timeRange === '1y') {
        const monthlyAverages: { [key: string]: { totalProgress: number; count: number } } = {};
        intervalDays.forEach(day => {
            const monthKey = format(day, 'MMM', { locale: es });
            if (!monthlyAverages[monthKey]) {
                monthlyAverages[monthKey] = { totalProgress: 0, count: 0 };
            }
            const dateStr = format(day, 'yyyy-MM-dd');
            const progress = progressMap.get(dateStr);
            if(progress !== undefined) {
                 monthlyAverages[monthKey].totalProgress += progress;
                 monthlyAverages[monthKey].count++;
            }
        });

        return {
            chartData: Object.entries(monthlyAverages).map(([month, { totalProgress, count }]) => {
                const avgProgress = count > 0 ? totalProgress / count : 0;
                const dataPoint: LifePrkProgressPoint = { date: month };
                lifePrksData.forEach(lp => { dataPoint[lp.id] = avgProgress; });
                return dataPoint;
            }),
            lifePrkNames
        };
    }

    return { chartData, lifePrkNames };
}

export async function getCalendarData(date: Date): Promise<CalendarDataPoint[]> {
    const supabase = createClient();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const [snapshots, allHabitTasks] = await Promise.all([
        supabase.from('daily_progress_snapshots').select('snapshot_date, progress')
            .gte('snapshot_date', format(monthStart, 'yyyy-MM-dd'))
            .lte('snapshot_date', format(monthEnd, 'yyyy-MM-dd')),
        supabase.from('habit_tasks').select('*').eq('archived', false)
    ]);

    if (snapshots.error || allHabitTasks.error) {
        console.error("Error fetching calendar data:", snapshots.error || allHabitTasks.error);
        return [];
    }

    const progressMap = new Map<string, number>();
    (snapshots.data || []).forEach(s => progressMap.set(s.snapshot_date, (s.progress || 0) * 100));
    
    const intervalDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const calendarData: CalendarDataPoint[] = [];

    const mappedAllHabitTasks = allHabitTasks.data.map(mapHabitTaskFromDb);

    for (const day of intervalDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const tasksForDay = mappedAllHabitTasks.filter(ht => {
             if (ht.type === 'project') {
                return isTaskActiveOnDate(ht, day);
            }
             if (!ht.startDate) return false;
            const startDate = startOfDay(parseISO(ht.startDate));
            if (isAfter(startDate, day)) return false;

            if (ht.frequency === 'specific_days' && ht.frequencyDays) {
                 const dayOfWeekMap: { [key: string]: number } = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
                const selectedDayOfWeek = getDay(day);
                const requiredDays = ht.frequencyDays.map(d => dayOfWeekMap[d]);
                return requiredDays.includes(selectedDayOfWeek);
            }
            return ht.frequency === 'daily' || ht.frequency === 'weekly' || ht.frequency === 'monthly';
        });

        calendarData.push({
            date: day.toISOString(),
            progress: progressMap.get(dateStr) ?? 0,
            tasks: tasksForDay // Nota: El estado `completedToday` ya no se calcula aquí
        });
    }

    return calendarData;
}
