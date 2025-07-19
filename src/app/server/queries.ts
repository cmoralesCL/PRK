
"use server";

import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog, TimeRangeOption } from '@/lib/types';
import { eachDayOfInterval, format, startOfDay, endOfDay, isSameDay, parseISO, getDay, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Determina si una tarea (especialmente un hábito) está activa en una fecha específica.
 * @param task La tarea a verificar.
 * @param date La fecha a verificar.
 * @returns `true` si la tarea está activa, `false` en caso contrario.
 */
function isTaskActiveOnDate(task: HabitTask, date: Date): boolean {
    const startDate = parseISO(task.startDate!);
    const targetDate = startOfDay(date);

    if (targetDate < startOfDay(startDate)) {
        return false; // La tarea aún no ha comenzado.
    }

    if (task.type === 'task' || task.type === 'project') {
        const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
        // La tarea es visible si está dentro de su rango O si no tiene fecha de vencimiento y ya empezó.
        // Se muestra hasta un día después de su fecha de vencimiento o finalización para permitir el registro tardío.
        const completionDate = task.completionDate ? parseISO(task.completionDate) : null;
        const effectiveEndDate = dueDate ? addDays(dueDate, 1) : completionDate ? addDays(completionDate, 1) : null;

        if (completionDate && isSameDay(completionDate, targetDate)) {
             return true; // Se completó hoy, debe ser visible.
        }
        if (completionDate && completionDate < targetDate) {
            return false; // Ya se completó en un día anterior.
        }

        if (dueDate) {
            return targetDate <= addDays(dueDate, 1);
        }

        return true; // Si no tiene fecha de vencimiento y ha comenzado, está activa hasta que se complete.

    } else if (task.type === 'habit') {
        switch (task.frequency) {
            case 'daily':
                return true;
            case 'weekly':
                // Activo una vez por semana en el mismo día de la semana que la fecha de inicio.
                return getDay(targetDate) === getDay(startDate);
            case 'monthly':
                 // Activo una vez al mes en el mismo día del mes que la fecha de inicio.
                return targetDate.getDate() === startDate.getDate();
            case 'specific_days':
                const dayOfWeek = format(targetDate, 'eee').toLowerCase(); // mon, tue, wed...
                return task.frequencyDays?.includes(dayOfWeek) ?? false;
            default:
                return false;
        }
    }
    return false;
}

/**
 * Obtiene todas las tareas y hábitos activos para una fecha específica, incluyendo su estado de completado.
 * @param date La fecha para la que se obtendrán las tareas.
 * @param allHabitTasks Una lista de todas las tareas y hábitos no archivados.
 * @param allProgressLogs Una lista de todos los registros de progreso.
 * @returns Una lista de tareas y hábitos activos para esa fecha.
 */
async function getHabitTasksForDate(date: Date, allHabitTasks: HabitTask[], allProgressLogs: ProgressLog[]): Promise<HabitTask[]> {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const activeTasks = allHabitTasks.filter(task => isTaskActiveOnDate(task, date));

    return activeTasks.map(task => {
        const completionLog = allProgressLogs.find(log => 
            log.habitTaskId === task.id && 
            format(parseISO(log.completion_date), 'yyyy-MM-dd') === dateString
        );

        return {
            ...task,
            completedToday: !!completionLog,
            // Aseguramos que `completionDate` refleje el log del día si existe.
            completionDate: completionLog ? dateString : (task.type !== 'habit' ? task.completionDate : undefined),
        };
    });
}

/**
 * Calcula el progreso en cascada para una fecha dada, desde las tareas hasta los PRK de Vida.
 * @param date La fecha para la que se calculará el progreso.
 * @param lifePrks Todos los PRK de Vida.
 * @param areaPrks Todos los PRK de Área.
 * @param habitTasks Las tareas y hábitos activos para esa fecha (obtenidos de `getHabitTasksForDate`).
 * @returns Un objeto con los PRK de vida y área, cada uno con su progreso calculado para ese día.
 */
function calculateProgressForDate(date: Date, lifePrks: LifePrk[], areaPrks: AreaPrk[], habitTasks: HabitTask[]) {
    const areaPrksWithProgress = areaPrks.map(areaPrk => {
        const relevantTasks = habitTasks.filter(ht => ht.areaPrkId === areaPrk.id);
        
        if (relevantTasks.length === 0) {
            return { ...areaPrk, progress: null }; // Sin medición
        }

        const totalWeight = relevantTasks.reduce((sum, task) => sum + task.weight, 0);
        const weightedCompleted = relevantTasks.reduce((sum, task) => {
            return sum + (task.completedToday ? task.weight : 0);
        }, 0);
        
        const progress = totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;
        return { ...areaPrk, progress };
    });

    const lifePrksWithProgress = lifePrks.map(lifePrk => {
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.lifePrkId === lifePrk.id && ap.progress !== null);
        
        if (relevantAreaPrks.length === 0) {
            return { ...lifePrk, progress: null }; // Sin medición
        }

        const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
        const progress = totalProgress / relevantAreaPrks.length;
        return { ...lifePrk, progress };
    });

    return { lifePrksWithProgress, areaPrksWithProgress };
}

export async function getDashboardData(selectedDateString: string) {
    const supabase = createClient();
    const selectedDate = parseISO(selectedDateString);

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) throw lifePrksError;

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) throw areaPrksError;

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('archived', false);
    if (habitTasksError) throw habitTasksError;

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*');
    if (progressLogsError) throw progressLogsError;

    const habitTasksForDay = await getHabitTasksForDate(selectedDate, allHabitTasks, allProgressLogs);
    
    const { lifePrksWithProgress, areaPrksWithProgress } = calculateProgressForDate(selectedDate, lifePrks, areaPrks, habitTasksForDay);

    return {
        lifePrks: lifePrksWithProgress,
        areaPrks: areaPrksWithProgress,
        habitTasks: habitTasksForDay,
    };
}

export async function getCalendarData(date: Date) {
    const supabase = createClient();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const interval = eachDayOfInterval({ start: subDays(monthStart, 7), end: addDays(monthEnd, 7) });

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('archived', false);
    if (habitTasksError) throw habitTasksError;

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*');
    if (progressLogsError) throw progressLogsError;
    
    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('id').eq('archived', false);
    if (lifePrksError) throw lifePrksError;

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('id, life_prk_id').eq('archived', false);
    if (areaPrksError) throw areaPrksError;

    const calendarData = await Promise.all(interval.map(async (day) => {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
        
        const mappedAreaPrks = areaPrks.map(ap => ({ id: ap.id, lifePrkId: ap.life_prk_id, archived: false, title: '', unit: '', targetValue: 0, currentValue: 0 }));

        const { lifePrksWithProgress } = calculateProgressForDate(day, lifePrks.map(lp => ({...lp, title: '', description: '', archived: false})), mappedAreaPrks, habitTasksForDay);
        
        const totalProgress = lifePrksWithProgress.reduce((sum, lp) => sum + (lp.progress ?? 0), 0);
        const measuredLifePrksCount = lifePrksWithProgress.filter(lp => lp.progress !== null).length;
        const finalProgress = measuredLifePrksCount > 0 ? totalProgress / measuredLifePrksCount : 0;

        return {
            date: day.toISOString(),
            progress: finalProgress,
            tasks: habitTasksForDay,
        };
    }));

    return calendarData;
}


export async function getLifePrkProgressData(options: { from: Date, to: Date, timeRange: TimeRangeOption }) {
    const supabase = createClient();
    const { from, to } = options;
    const interval = eachDayOfInterval({ start: from, end: to });

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('archived', false);
    if (habitTasksError) throw habitTasksError;

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*');
    if (progressLogsError) throw progressLogsError;

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) throw lifePrksError;

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) throw areaPrksError;

    const lifePrkNames = lifePrks.reduce((acc, lp) => {
        acc[lp.id] = lp.title;
        return acc;
    }, {} as Record<string, string>);

    const chartData = await Promise.all(interval.map(async (day) => {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
        const { lifePrksWithProgress } = calculateProgressForDate(day, lifePrks, areaPrks, habitTasksForDay);

        const dataPoint: { date: string; [key: string]: number | string } = {
            date: format(day, 'dd/MM'),
        };

        lifePrksWithProgress.forEach(lp => {
            dataPoint[lp.id] = lp.progress ?? 0;
        });

        return dataPoint;
    }));

    return { chartData, lifePrkNames };
}
