








"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import { LifePrk, AreaPrk, HabitTask, ProgressLog, DailyProgressSnapshot, WeeklyProgressSnapshot } from "@/lib/types";
import { 
    format, 
    startOfDay, 
    parseISO, 
    getDay, 
    addDays, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameDay, 
    startOfWeek, 
    endOfWeek, 
    isWithinInterval,
    startOfYear,
    endOfQuarter,
    startOfQuarter,
    addMonths,
    areIntervalsOverlapping,
    differenceInWeeks,
    differenceInMonths,
    differenceInDays,
    isAfter,
    isBefore,
    endOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { logError } from "@/lib/logger";


export async function getAiSuggestions(input: SuggestRelatedHabitsTasksInput): Promise<string[]> {
  try {
    const result = await suggestRelatedHabitsTasks(input);
    return result.suggestions || [];
  } catch (error) {
    await logError(error, { at: 'getAiSuggestions', input });
    console.error("Error al obtener sugerencias de la IA:", error);
    return [];
  }
}

export async function addLifePrk(values: { title: string; description?: string }) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from('life_prks').insert([{ 
            title: values.title, 
            description: values.description || '',
        }]);

        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'addLifePrk', values });
        console.error("Error adding Life PRK:", error);
        throw error;
    }
    revalidatePath('/');
}

export async function updateLifePrk(id: string, values: { title: string; description?: string }) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('life_prks')
            .update({ 
                title: values.title, 
                description: values.description || '',
            })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'updateLifePrk', id, values });
        console.error("Error updating Life PRK:", error);
        throw error;
    }
    revalidatePath('/');
}

export async function addAreaPrk(values: { title: string; description?: string, life_prk_id: string }) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from('area_prks').insert([{ 
            title: values.title,
            description: values.description || '',
            unit: '%', // Hardcode default unit
            life_prk_id: values.life_prk_id,
            target_value: 100,
            current_value: 0,
         }]);

        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'addAreaPrk', values });
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
}

export async function updateAreaPrk(id: string, values: { title: string; description?: string }) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('area_prks')
            .update({ 
                title: values.title,
                description: values.description || '',
            })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'updateAreaPrk', id, values });
        console.error('Supabase error updating Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
}

export async function addHabitTask(values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived_at' | 'archived'>>) {
    const supabase = createClient();
    
    const dataToInsert: any = { ...values };

    try {
        const { data, error } = await supabase.from('habit_tasks').insert([dataToInsert]);
        if(error) {
            await logError(error, { at: 'addHabitTask', values: dataToInsert });
            throw error;
        }
    } catch (error) {
        // Error is logged above
        console.error("Error adding Habit/Task:", error);
        throw error;
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function updateHabitTask(id: string, values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived' | 'archived_at'>>): Promise<void> {
    const supabase = createClient();
    
    const updateData: any = {};

    const fieldsToCopy: (keyof typeof values)[] = ['title', 'description', 'area_prk_id', 'weight', 'is_critical', 'start_date', 'due_date', 'type'];
    fieldsToCopy.forEach(field => {
        if(values[field] !== undefined) {
            updateData[field] = values[field];
        }
    });

    if (values.type === 'habit') {
        updateData.frequency = values.frequency;
        updateData.measurement_type = values.measurement_type;
        updateData.measurement_goal = values.measurement_goal;
        updateData.frequency_days = values.frequency_days;
        updateData.frequency_day_of_month = values.frequency_day_of_month;
        updateData.frequency_interval = values.frequency_interval;
        updateData.frequency_unit = values.frequency_unit;
    } else {
        updateData.frequency = null;
        updateData.measurement_type = null;
        updateData.measurement_goal = null;
        updateData.frequency_days = null;
        updateData.frequency_day_of_month = null;
        updateData.frequency_interval = null;
        updateData.frequency_unit = null;
    }

    try {
        const { error } = await supabase
            .from('habit_tasks')
            .update(updateData)
            .eq('id', id);

        if (error) {
            await logError(error, { at: 'updateHabitTask', id, values: updateData });
            throw error;
        }
    } catch (error) {
        console.error("Error updating Habit/Task:", error);
        throw error;
    }

    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function logHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'project' | 'task', completionDate: string, progressValue?: number) {
    const supabase = createClient();
    try {
        if (type === 'project' || type === 'task') {
            const { error: updateError } = await supabase
                .from('habit_tasks')
                .update({ completion_date: completionDate })
                .eq('id', habitTaskId);
            if (updateError) throw updateError;
        }

        let completionPercentage = 1.0; 

        if (progressValue !== undefined) {
            const { data: task, error: taskError } = await supabase
                .from('habit_tasks')
                .select('measurement_goal, measurement_type, frequency')
                .eq('id', habitTaskId)
                .single();

            if (taskError || !task) {
                await logError(taskError, { at: 'logHabitTaskCompletion - get task for percentage' });
                throw new Error(`Could not find task with id ${habitTaskId} to calculate progress percentage.`);
            }
            
            if (task.measurement_type === 'quantitative') {
                const target = task.measurement_goal?.target_count;
                if (typeof target === 'number' && target > 0) {
                    completionPercentage = progressValue / target;
                } else {
                     completionPercentage = progressValue > 0 ? 1 : 0;
                }
            } else if (task.measurement_type === 'binary') {
                // For accumulative binary, each log is 100% of that instance
                completionPercentage = 1.0;
            }
        }

        const upsertData: Omit<ProgressLog, 'id' | 'created_at'> = {
            habit_task_id: habitTaskId,
            completion_date: completionDate,
            // For binary accumulative habits, the progress value is always 1 for each log entry
            progress_value: progressValue ?? 1,
            completion_percentage: completionPercentage,
        };
        
        const { error: logErrorObj } = await supabase.from('progress_logs').upsert(
            upsertData, 
            { onConflict: 'habit_task_id, completion_date' }
        );

        if (logErrorObj) throw logErrorObj;

        revalidatePath('/');
        revalidatePath('/calendar');
    } catch (error) {
        await logError(error, { at: 'logHabitTaskCompletion', habitTaskId, completionDate, progressValue });
        console.error('Error in logHabitTaskCompletion:', error);
        throw new Error('Failed to log task completion.');
    }
}

export async function removeHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'project' | 'task', completionDate: string) {
    const supabase = createClient();
    try {
        if (type === 'project' || type === 'task') {
            const { error } = await supabase
                .from('habit_tasks')
                .update({ completion_date: null })
                .eq('id', habitTaskId);
            if (error) throw error;
        }
        
        const { error } = await supabase
            .from('progress_logs')
            .delete()
            .eq('habit_task_id', habitTaskId)
            .eq('completion_date', completionDate);

        if (error) {
            console.warn(`Could not find a log to delete for habit ${habitTaskId} on ${completionDate}:`, error.message);
        }
        
        revalidatePath('/');
        revalidatePath('/calendar');
    } catch (error) {
        await logError(error, { at: 'removeHabitTaskCompletion', habitTaskId, completionDate });
        console.error('Error in removeHabitTaskCompletion:', error);
        throw new Error('Failed to remove task completion log.');
    }
}

export async function archiveLifePrk(id: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase.from('life_prks').update({ archived: true }).eq('id', id);
        if(error) throw error;
    } catch (error) {
        await logError(error, { at: 'archiveLifePrk', id });
        console.error("Error archiving life prk:", error);
        throw new Error("Failed to archive life prk.");
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function archiveAreaPrk(id: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase.from('area_prks').update({ archived: true }).eq('id', id);
        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'archiveAreaPrk', id });
        console.error("Error archiving area prk:", error);
        throw new Error("Failed to archive area prk.");
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function archiveHabitTask(id: string, archiveDate: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('habit_tasks')
            .update({ archived: true, archived_at: archiveDate })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'archiveHabitTask', id, archiveDate });
        console.error("Error archiving habit/task:", error);
        throw new Error("Failed to archive habit/task.");
    }

    revalidatePath('/');
    revalidatePath('/calendar');
}


/**
 * Determina si una tarea (especialmente un hábito) está activa en una fecha específica.
 * @param task La tarea a verificar.
 * @param date La fecha a verificar.
 * @returns `true` si la tarea está activa, `false` en caso contrario.
 */
function isTaskActiveOnDate(task: HabitTask, date: Date): boolean {
    const targetDate = startOfDay(date);

    // Common checks for all types
    if (!task.start_date) {
        return false; 
    }
    
    const startDate = startOfDay(parseISO(task.start_date));

    // Check archived status based on date
    if (task.archived && task.archived_at && isAfter(targetDate, startOfDay(parseISO(task.archived_at)))) {
        return false;
    }

    // Must be on or after start date
    if (isBefore(targetDate, startDate)) {
        return false;
    }
    
    // Check due date if it exists
    const endDate = task.due_date ? startOfDay(parseISO(task.due_date)) : null;
    
    // --- Type Specific Logic ---
    // For single-instance tasks/projects
    if (task.type === 'task' || task.type === 'project') {
        // A single action task is active on its start date, or within its start/due date range.
        // It should not appear after its due date, regardless of completion.
        if (endDate) {
            // Active if targetDate is between start and end (inclusive)
            return isWithinInterval(targetDate, { start: startDate, end: endDate });
        }
        // If no end date, it's active only on the start date.
        return isSameDay(targetDate, startDate);
    }
    
    // If it's a habit, it can't be active past its due_date.
    if (endDate && isAfter(targetDate, endDate)) {
        return false;
    }

    // For recurring habits
    if (task.type === 'habit') {
        // Frequencies for commitments should not appear on the calendar
        if (task.frequency?.includes('ACUMULATIVO')) {
            return false;
        }

        switch (task.frequency) {
            case 'DIARIA':
                return true;

            case 'SEMANAL_DIAS_FIJOS':
                // date-fns: Sunday=0, Monday=1, ..., Saturday=6
                const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
                const dayOfWeek = getDay(targetDate);
                return task.frequency_days?.includes(dayMap[dayOfWeek]) ?? false;
            
            case 'INTERVALO_DIAS':
                if (!task.frequency_interval) return false;
                const diffDays = differenceInDays(targetDate, startDate);
                return diffDays >= 0 && diffDays % task.frequency_interval === 0;
            
            case 'INTERVALO_SEMANAL_DIAS_FIJOS': {
                if (!task.frequency_interval || !task.frequency_days) return false;
                
                const startOfWeekDate = startOfWeek(startDate, { weekStartsOn: 1 });
                const targetWeekStartDate = startOfWeek(targetDate, { weekStartsOn: 1 });
                const weekDiffInDays = differenceInDays(targetWeekStartDate, startOfWeekDate);

                if (weekDiffInDays < 0) return false;

                const weekDiff = Math.floor(weekDiffInDays / 7);

                if (weekDiff % task.frequency_interval !== 0) {
                    return false;
                }

                const dayMapWeekly = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
                const dayOfWeekWeekly = getDay(targetDate);
                return task.frequency_days.includes(dayMapWeekly[dayOfWeekWeekly]);
            }

            case 'MENSUAL_DIA_FIJO':
                if (!task.frequency_day_of_month) return false;
                const dateDay = targetDate.getDate();
                const lastDayOfMonth = endOfMonth(targetDate).getDate();

                // Handle cases like setting 31 for a month with 30 days. It should fall on the last day.
                return dateDay === Math.min(task.frequency_day_of_month, lastDayOfMonth);
            
            case 'INTERVALO_MENSUAL_DIA_FIJO':
                if (!task.frequency_interval || !task.frequency_day_of_month) return false;
                const monthDiff = differenceInMonths(targetDate, startDate);
                if (monthDiff < 0 || monthDiff % task.frequency_interval !== 0) {
                    return false;
                }
                const dateDayMonthly = targetDate.getDate();
                const lastDayOfMonthMonthly = endOfMonth(targetDate).getDate();
                return dateDayMonthly === Math.min(task.frequency_day_of_month, lastDayOfMonthMonthly);

            case 'ANUAL_FECHA_FIJA':
                const startMonth = startDate.getMonth();
                const startDay = startDate.getDate();
                return targetDate.getMonth() === startMonth && targetDate.getDate() === startDay;

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
            log.habit_task_id === task.id && 
            isSameDay(parseISO(log.completion_date), date)
        );
        
        let completedToday = !!completionLog;
        let progressValue = completionLog?.progress_value;
        let completionPercentage = completionLog?.completion_percentage ?? 0;

        if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count && completionLog) {
            completedToday = (progressValue ?? 0) >= task.measurement_goal.target_count;
        } else if (completionLog) {
            completedToday = completionPercentage >= 1;
        }

        return {
            ...task,
            completedToday: completedToday,
            current_progress_value: progressValue,
            completion_date: completionLog ? dateString : (task.type !== 'habit' ? task.completion_date : undefined),
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
        const relevantTasks = habitTasks.filter(ht => ht.area_prk_id === areaPrk.id);
        
        if (relevantTasks.length === 0) {
            return { ...areaPrk, progress: null };
        }
        
        const hasFailedCriticalTask = relevantTasks.some(task => task.is_critical && !task.completedToday);

        if (hasFailedCriticalTask) {
            return { ...areaPrk, progress: 0 };
        }

        const totalWeight = relevantTasks.reduce((sum, task) => sum + task.weight, 0);
        
        const weightedCompleted = relevantTasks.reduce((sum, task) => {
            if (task.completedToday) {
                 if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count) {
                    const progressPercentage = (task.current_progress_value ?? 0) / task.measurement_goal.target_count;
                    return sum + (progressPercentage * task.weight);
                }
                return sum + (1 * task.weight);
            }
            return sum;
        }, 0);
        
        const progress = totalWeight > 0 ? (weightedCompleted / totalWeight) * 100 : 0;
        return { ...areaPrk, progress };
    });

    const lifePrksWithProgress = lifePrks.map(lifePrk => {
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.life_prk_id === lifePrk.id && ap.progress !== null);
        
        if (relevantAreaPrks.length === 0) {
            return { ...lifePrk, progress: null };
        }

        const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
        const progress = totalProgress / relevantAreaPrks.length;
        return { ...lifePrk, progress };
    });

    return { lifePrksWithProgress, areaPrksWithProgress };
}

function getActiveCommitments(allHabitTasks: HabitTask[], allProgressLogs: ProgressLog[], referenceDate: Date) {
    const periodStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const periodEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    return allHabitTasks.filter(task => {
        // Basic filtering
        if (!task.frequency?.includes('ACUMULATIVO') || !task.start_date) {
            return false;
        }
        const taskStartDate = parseISO(task.start_date);

        // Check archived status based on date
        if (task.archived && task.archived_at && isAfter(referenceDate, startOfDay(parseISO(task.archived_at)))) {
            return false;
        }
        
        if (isAfter(taskStartDate, monthEnd)) return false; // Use monthEnd as the widest possible range for this check
        if (task.due_date && isBefore(parseISO(task.due_date), periodStart)) return false;

        const taskInterval = { start: taskStartDate, end: task.due_date ? parseISO(task.due_date) : new Date(8640000000000000) };
        const weekInterval = { start: periodStart, end: periodEnd };
        
        if (task.frequency.startsWith('SEMANAL')) {
            if (!areIntervalsOverlapping(weekInterval, taskInterval, { inclusive: true })) return false;

            if (task.frequency === 'SEMANAL_ACUMULATIVO_RECURRENTE') {
                if (!task.frequency_interval) return false;
                const weekDiff = Math.floor(differenceInDays(startOfWeek(periodStart, { weekStartsOn: 1 }), startOfWeek(taskStartDate, { weekStartsOn: 1 })) / 7);
                return weekDiff >= 0 && weekDiff % task.frequency_interval === 0;
            }
            return true; // Is a standard weekly commitment active in this period
        }
        
        if (task.frequency.startsWith('MENSUAL')) {
            if (!areIntervalsOverlapping({start: monthStart, end: monthEnd}, taskInterval, { inclusive: true })) return false;

            if (task.frequency === 'MENSUAL_ACUMULATIVO_RECURRENTE') {
                if (!task.frequency_interval) return false;
                const monthDiff = differenceInMonths(monthStart, taskStartDate);
                return monthDiff >= 0 && monthDiff % task.frequency_interval === 0;
            }
            return true;
        }

        return false; // For now, only weekly and monthly on dashboard
    }).map(task => {
        let logs: ProgressLog[] = [];
        let periodStartForLogs: Date, periodEndForLogs: Date;
        
        const freq = task.frequency;

        if(freq?.startsWith('SEMANAL')) {
            periodStartForLogs = startOfWeek(referenceDate, { weekStartsOn: 1 });
            periodEndForLogs = endOfWeek(referenceDate, { weekStartsOn: 1 });
        } else { // MENSUAL
            periodStartForLogs = monthStart;
            periodEndForLogs = monthEnd;
        }
        
        logs = allProgressLogs.filter(log => 
            log.habit_task_id === task.id &&
            isWithinInterval(parseISO(log.completion_date), { start: periodStartForLogs, end: periodEndForLogs })
        );

        const totalProgressValue = logs.reduce((sum, log) => sum + (log.progress_value ?? (log.completion_percentage ? 1 : 0)), 0);
        
        let isCompleted = false;
        if (task.measurement_type === 'binary' || task.measurement_type === 'quantitative') {
            const target = task.measurement_goal?.target_count ?? 1;
            isCompleted = target > 0 ? totalProgressValue >= target : totalProgressValue > 0;
        }

        return {
            ...task,
            current_progress_value: totalProgressValue,
            completedToday: isCompleted,
            logs: logs, // Pass the logs to the component for detailed checks
        };
    });
}


export async function getDashboardData(selectedDateString: string) {
    const supabase = createClient();
    const selectedDate = parseISO(selectedDateString);

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) {
        await logError(lifePrksError, {at: 'getDashboardData - lifePrks'});
        throw lifePrksError;
    };

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) {
        await logError(areaPrksError, {at: 'getDashboardData - areaPrks'});
        throw areaPrksError;
    }

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*');
    if (habitTasksError) {
        await logError(habitTasksError, {at: 'getDashboardData - allHabitTasks'});
        throw habitTasksError;
    }

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*');
    if (progressLogsError) {
        await logError(progressLogsError, {at: 'getDashboardData - allProgressLogs'});
        throw progressLogsError;
    }
    
    const habitTasksForDay = await getHabitTasksForDate(selectedDate, allHabitTasks, allProgressLogs);
    
    const { lifePrksWithProgress, areaPrksWithProgress } = calculateProgressForDate(selectedDate, lifePrks, areaPrks, habitTasksForDay);

    const commitments = getActiveCommitments(allHabitTasks, allProgressLogs, selectedDate);

    return {
        lifePrks: lifePrksWithProgress,
        areaPrks: areaPrksWithProgress,
        habitTasks: habitTasksForDay,
        commitments: commitments,
    };
}


export async function getCalendarData(monthDate: Date) {
    const supabase = createClient();

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const daysInView = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) {
        await logError(lifePrksError, {at: 'getCalendarData - lifePrks'});
        throw lifePrksError;
    }

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) {
        await logError(areaPrksError, {at: 'getCalendarData - areaPrks'});
        throw areaPrksError;
    }

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*');
    if (habitTasksError) {
        await logError(habitTasksError, {at: 'getCalendarData - allHabitTasks'});
        throw habitTasksError;
    }

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*').gte('completion_date', format(calendarStart, 'yyyy-MM-dd')).lte('completion_date', format(calendarEnd, 'yyyy-MM-dd'));
    if (progressLogsError) {
        await logError(progressLogsError, {at: 'getCalendarData - allProgressLogs'});
        throw progressLogsError;
    }

    const dailyProgress: DailyProgressSnapshot[] = [];
    const habitTasksByDay: Record<string, HabitTask[]> = {};

    for (const day of daysInView) {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
        
        if (habitTasksForDay.length > 0) {
            const { lifePrksWithProgress } = calculateProgressForDate(day, lifePrks, areaPrks, habitTasksForDay);
            
            const relevantLifePrks = lifePrksWithProgress.filter(lp => lp.progress !== null);
            const overallProgress = relevantLifePrks.length > 0
                ? relevantLifePrks.reduce((sum, lp) => sum + (lp.progress ?? 0), 0) / relevantLifePrks.length
                : 0;

            dailyProgress.push({
                id: format(day, 'yyyy-MM-dd'),
                snapshot_date: format(day, 'yyyy-MM-dd'),
                progress: isNaN(overallProgress) ? 0 : overallProgress,
            });
        }
        
        habitTasksByDay[format(day, 'yyyy-MM-dd')] = habitTasksForDay;
    }
    
    const commitments = allHabitTasks.filter(task => {
        if (!task.frequency?.includes('ACUMULATIVO') || !task.start_date) return false;
        
        const taskStartDate = parseISO(task.start_date);
        const refDateStartOfMonth = startOfMonth(monthDate);

        if (task.archived && task.archived_at && isBefore(refDateStartOfMonth, startOfDay(parseISO(task.archived_at)))) {
             return false;
        }

        if (isAfter(taskStartDate, endOfMonth(monthDate))) return false;
        if (task.due_date && isBefore(parseISO(task.due_date), refDateStartOfMonth)) return false;
        
        const taskInterval = { start: taskStartDate, end: task.due_date ? parseISO(task.due_date) : new Date(8640000000000000) };
        const monthInterval = { start: monthStart, end: monthEnd };

        switch (task.frequency) {
            case 'SEMANAL_ACUMULATIVO':
            case 'MENSUAL_ACUMULATIVO':
            case 'TRIMESTRAL_ACUMULATIVO':
            case 'ANUAL_ACUMULATIVO':
                return areIntervalsOverlapping(monthInterval, taskInterval, { inclusive: true });

            case 'SEMANAL_ACUMULATIVO_RECURRENTE':
                if (!task.frequency_interval) return false;
                for (let i = 0; i < daysInView.length; i += 7) {
                    const weekStart = daysInView[i];
                    if (areIntervalsOverlapping({ start: weekStart, end: addDays(weekStart, 6) }, taskInterval)) {
                        const weekDiff = Math.floor(differenceInDays(startOfWeek(weekStart, { weekStartsOn: 1 }), startOfWeek(taskStartDate, { weekStartsOn: 1 })) / 7);
                        if (weekDiff >= 0 && weekDiff % task.frequency_interval === 0) return true;
                    }
                }
                return false;

            case 'MENSUAL_ACUMULATIVO_RECURRENTE':
                if (!task.frequency_interval) return false;
                if (!areIntervalsOverlapping(monthInterval, taskInterval)) return false;
                const monthDiff = differenceInMonths(monthStart, startOfMonth(taskStartDate));
                return monthDiff >= 0 && monthDiff % task.frequency_interval === 0;

            case 'TRIMESTRAL_ACUMULATIVO_RECURRENTE':
                 if (!task.frequency_interval) return false;
                if (!areIntervalsOverlapping(monthInterval, taskInterval)) return false;
                const currentQuarterStart = startOfQuarter(monthDate);
                const taskQuarterStart = startOfQuarter(taskStartDate);
                const quarterDiff = Math.floor(differenceInMonths(currentQuarterStart, taskQuarterStart) / 3);
                return quarterDiff >= 0 && quarterDiff % task.frequency_interval === 0;

            default: return false;
        }
    }).map(task => {
        let periodStartForLogs: Date, periodEndForLogs: Date;
        
        const freq = task.frequency;
        
        let referenceDateForPeriod = monthDate;
        if(task.frequency?.startsWith('SEMANAL')) {
            // For weekly commitments, the reference date should be within the month's view
             referenceDateForPeriod = isWithinInterval(new Date(), {start: monthStart, end: monthEnd}) ? new Date() : monthStart;
        }

        if(freq?.startsWith('SEMANAL')) {
            periodStartForLogs = startOfWeek(referenceDateForPeriod, { weekStartsOn: 1 });
            periodEndForLogs = endOfWeek(referenceDateForPeriod, { weekStartsOn: 1 });
        } else if (freq?.startsWith('MENSUAL')) {
            periodStartForLogs = monthStart;
            periodEndForLogs = monthEnd;
        } else if (freq?.startsWith('TRIMESTRAL')) {
            periodStartForLogs = startOfQuarter(monthDate);
            periodEndForLogs = endOfQuarter(monthDate);
        } else { // ANUAL
            periodStartForLogs = startOfYear(monthDate);
            periodEndForLogs = endOfYear(monthDate);
        }

        const logs = allProgressLogs.filter(log => 
            log.habit_task_id === task.id &&
            isWithinInterval(parseISO(log.completion_date), { start: periodStartForLogs, end: periodEndForLogs })
        );

        const totalProgressValue = logs.reduce((sum, log) => sum + (log.progress_value ?? (log.completion_percentage ? 1 : 0)), 0);
        
        let isCompletedForPeriod = false;
        const target = task.measurement_goal?.target_count ?? 1;
        if (target > 0) {
            isCompletedForPeriod = totalProgressValue >= target;
        }

        return {
            ...task,
            current_progress_value: totalProgressValue,
            completedToday: isCompletedForPeriod, // "completedToday" means "completed for the period"
            logs: logs,
        };
    });

    const weeklyProgress: WeeklyProgressSnapshot[] = [];
    let weekIndex = 0;
    while(weekIndex < daysInView.length) {
        const weekStart = daysInView[weekIndex];
        const weekEnd = addDays(weekStart, 6);
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        let totalWeightedProgress = 0;
        let totalWeight = 0;

        // 1. Daily tasks progress
        weekDays.forEach(d => {
            const dayString = format(d, 'yyyy-MM-dd');
            const tasks = habitTasksByDay[dayString] ?? [];
            if (tasks.length > 0) {
                tasks.forEach(task => {
                    const log = allProgressLogs.find(l => l.habit_task_id === task.id && l.completion_date === dayString);
                    const progressPercentage = log?.completion_percentage ?? 0;
                    totalWeightedProgress += progressPercentage * task.weight;
                    totalWeight += task.weight;
                });
            }
        });
        
        // 2. Weekly commitments progress
        const weeklyCommitmentTasks = commitments.filter(c => {
             if (!c.frequency?.startsWith('SEMANAL_ACUMULATIVO') || !c.start_date) return false;
             const taskStartDate = parseISO(c.start_date);
             const taskEndDate = c.due_date ? parseISO(c.due_date) : new Date(8640000000000000);
             if (!areIntervalsOverlapping({ start: weekStart, end: weekEnd }, { start: taskStartDate, end: taskEndDate })) {
                 return false;
             }
             if (c.frequency === 'SEMANAL_ACUMULATIVO_RECURRENTE' && c.frequency_interval) {
                const weekDiff = Math.floor(differenceInDays(weekStart, startOfWeek(taskStartDate, {weekStartsOn: 1})) / 7);
                if (weekDiff < 0 || weekDiff % c.frequency_interval !== 0) {
                    return false;
                }
             }
             return true;
        });
        
        weeklyCommitmentTasks.forEach(task => {
            let progressPercentage = 0;
            const logs = allProgressLogs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: weekStart, end: weekEnd }));
            const target = task.measurement_goal?.target_count ?? 1;

            if (task.measurement_type === 'quantitative') {
                const totalValue = logs.reduce((sum, log) => sum + (log.progress_value ?? 0), 0);
                progressPercentage = target > 0 ? (totalValue / target) : 0;
            } else if (task.measurement_type === 'binary') {
                const completions = logs.length;
                progressPercentage = target > 0 ? (completions / target) : 0;
            }
            
            totalWeightedProgress += Math.min(progressPercentage, 1) * task.weight;
            totalWeight += task.weight;
        });
        
        const combinedAvgProgress = totalWeight > 0
            ? (totalWeightedProgress / totalWeight) * 100
            : 0;

        weeklyProgress.push({
            id: format(weekStart, 'yyyy-MM-dd'),
            progress: combinedAvgProgress > 100 ? 100 : combinedAvgProgress,
        });

        weekIndex += 7;
    }

    // Calculate Monthly Progress
    let totalMonthlyWeightedProgress = 0;
    let totalMonthlyWeight = 0;

    // Daily tasks for the month
    daysInMonth.forEach(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const tasks = habitTasksByDay[dayString] ?? [];
        tasks.forEach(task => {
            const log = allProgressLogs.find(l => l.habit_task_id === task.id && l.completion_date === dayString);
            const progressPercentage = log?.completion_percentage ?? 0;
            totalMonthlyWeightedProgress += progressPercentage * task.weight;
            totalMonthlyWeight += task.weight;
        });
    });
    
    // Accumulative commitments for the month
    commitments.forEach(task => {
        if (!task.frequency || !task.start_date) return;
        
        const target = task.measurement_goal?.target_count ?? 1;
        let periodProgress = 0;

        // --- Calculate the progress for this specific commitment ---
        if (task.frequency.startsWith('SEMANAL')) {
            let weekStart = startOfWeek(monthStart, {weekStartsOn: 1});
            let weeksInPeriod = 0;
            while(weekStart <= monthEnd) {
                const weekEnd = endOfWeek(weekStart, {weekStartsOn: 1});
                
                 if (task.frequency === 'SEMANAL_ACUMULATIVO_RECURRENTE' && task.frequency_interval) {
                    const taskStartDate = parseISO(task.start_date);
                    const startWeekForTask = startOfWeek(taskStartDate, {weekStartsOn: 1});
                    const weekDiff = Math.floor(differenceInDays(weekStart, startWeekForTask) / 7);
                    if (weekDiff < 0 || weekDiff % task.frequency_interval !== 0) {
                         weekStart = addDays(weekStart, 7);
                         continue;
                    }
                 }

                const taskEndDate = task.due_date ? parseISO(task.due_date) : endOfMonth(monthEnd);
                if (!areIntervalsOverlapping({start: weekStart, end: weekEnd}, {start: parseISO(task.start_date), end: taskEndDate})) {
                    weekStart = addDays(weekStart, 7);
                    continue;
                }

                weeksInPeriod++;

                const logs = allProgressLogs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: weekStart, end: weekEnd }));
                
                if (task.measurement_type === 'quantitative') {
                    const totalValue = logs.reduce((sum, log) => sum + (log.progress_value ?? 0), 0);
                    periodProgress += target > 0 ? (totalValue / target) : 0;
                } else if (task.measurement_type === 'binary') {
                    const completions = logs.length;
                    periodProgress += target > 0 ? (completions / target) : 0;
                }
                weekStart = addDays(weekStart, 7);
            }
            if(weeksInPeriod > 0) periodProgress /= weeksInPeriod;

        } else { // Monthly, Quarterly, Annual commitments
            const logs = allProgressLogs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: monthStart, end: monthEnd }));
             if (task.measurement_type === 'quantitative') {
                const totalValue = logs.reduce((sum, log) => sum + (log.progress_value ?? 0), 0);
                periodProgress = target > 0 ? (totalValue / target) : 0;
            } else if (task.measurement_type === 'binary') {
                const completions = logs.length;
                periodProgress = target > 0 ? (completions / target) : 0;
            }
        }
        
        totalMonthlyWeightedProgress += Math.min(periodProgress, 1) * task.weight;
        totalMonthlyWeight += task.weight;
    });

    const monthlyProgress = totalMonthlyWeight > 0
        ? (totalMonthlyWeightedProgress / totalMonthlyWeight) * 100
        : 0;

    return {
        dailyProgress,
        habitTasks: habitTasksByDay,
        weeklyProgress,
        monthlyProgress: monthlyProgress > 100 ? 100 : monthlyProgress,
        areaPrks,
        commitments,
    };
}


/**
 * Returns the start of the semester for a given date.
 * January 1st for the first semester (months 0-5).
 * July 1st for the second semester (months 6-11).
 * @param date The date to check.
 * @returns The start date of the semester.
 */
export async function startOfSemester(date: Date): Promise<Date> {
    const month = date.getMonth();
    const year = date.getFullYear();
    // First semester (Jan-Jun) starts in January (month 0).
    // Second semester (Jul-Dec) starts in July (month 6).
    const startMonth = month < 6 ? 0 : 6;
    return new Date(year, startMonth, 1);
}

/**
 * Returns the end of the semester for a given date.
 * June 30th for the first semester.
 * December 31st for the second semester.
 * @param date The date to check.
 * @returns The end date of the semester.
 */
export async function endOfSemester(date: Date): Promise<Date> {
    const start = await startOfSemester(date);
    // Add 5 months to get to June or December, then get the end of that month.
    const endMonth = addMonths(start, 5);
    return endOfMonth(endMonth);
}
