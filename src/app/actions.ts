
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import { LifePrk, AreaPrk, HabitTask, ProgressLog, DailyProgressSnapshot } from "@/lib/types";
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
    endOfYear,
    startOfQuarter,
    endOfQuarter,
    addMonths
} from 'date-fns';


export async function getAiSuggestions(input: SuggestRelatedHabitsTasksInput): Promise<string[]> {
  try {
    const result = await suggestRelatedHabitsTasks(input);
    return result.suggestions || [];
  } catch (error) {
    console.error("Error al obtener sugerencias de la IA:", error);
    return [];
  }
}

export async function addLifePrk(values: { title: string; description?: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('life_prks').insert([{ 
        title: values.title, 
        description: values.description || '',
    }]);

    if(error) {
        console.error("Error adding Life PRK:", error);
        throw error;
    }
    revalidatePath('/');
}

export async function updateLifePrk(id: string, values: { title: string; description?: string }) {
    const supabase = createClient();
    const { error } = await supabase
        .from('life_prks')
        .update({ 
            title: values.title, 
            description: values.description || '',
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating Life PRK:", error);
        throw error;
    }
    revalidatePath('/');
}

export async function addAreaPrk(values: { title: string; life_prk_id: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('area_prks').insert([{ 
        title: values.title,
        unit: '%', // Hardcode default unit
        life_prk_id: values.life_prk_id,
        target_value: 100,
        current_value: 0,
     }]);

    if(error) {
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
}

export async function updateAreaPrk(id: string, values: { title: string; }) {
    const supabase = createClient();
    const { error } = await supabase
        .from('area_prks')
        .update({ 
            title: values.title,
        })
        .eq('id', id);

    if (error) {
        console.error('Supabase error updating Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
}

export async function addHabitTask(values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived_at'>>) {
    const supabase = createClient();
    const { data, error } = await supabase.from('habit_tasks').insert([{ ...values }]);

    if(error) {
        console.error("Error adding Habit/Task:", error);
        throw error;
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function updateHabitTask(id: string, values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived_at'>>): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('habit_tasks')
      .update({ ...values })
      .eq('id', id);
  
    if (error) {
        console.error("Error updating Habit/Task:", error);
        throw error;
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function logHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'project' | 'task', completionDate: string) {
    const supabase = createClient();
    try {
        // For weekly commitments, we also log completion, but they don't have a daily impact.
        // For one-off tasks/projects, we set their completion date.
        if (type === 'project' || type === 'task') {
            const { error: updateError } = await supabase
                .from('habit_tasks')
                .update({ completion_date: completionDate })
                .eq('id', habitTaskId);
            if (updateError) throw updateError;
        } 

        const { error: logError } = await supabase.from('progress_logs').insert([{
            habit_task_id: habitTaskId,
            completion_date: completionDate,
            progress_value: null, 
            completion_percentage: 1.0,
        }]);

        if (logError) throw logError;

        revalidatePath('/');
        revalidatePath('/calendar');
    } catch (error) {
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
        console.error("Error archiving area prk:", error);
        throw new Error("Failed to archive area prk.");
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function archiveHabitTask(id: string) {
    const supabase = createClient();
    try {
        // Set archived_at to the current timestamp
        const { error } = await supabase.from('habit_tasks').update({ archived_at: new Date().toISOString() }).eq('id', id);
        if(error) throw error;
    } catch (error) {
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

    // Si la tarea fue archivada, no está activa en la fecha de archivado o después.
    if (task.archived_at && targetDate >= startOfDay(parseISO(task.archived_at))) {
        return false;
    }

    if (!task.start_date) {
        return false; // No puede estar activa si no tiene fecha de inicio.
    }
    const startDate = parseISO(task.start_date);


    if (task.type === 'task' || task.type === 'project') {
        const dueDate = task.due_date ? parseISO(task.due_date) : null;
        const completionDate = task.completion_date ? parseISO(task.completion_date) : null;

        // Si ya se completó antes del día que estamos viendo, no está activa.
        if (completionDate && completionDate < targetDate) {
            return false;
        }
        
        // Si no tiene fecha de vencimiento, es activa solo en su fecha de inicio.
        if (!dueDate) {
            return isSameDay(targetDate, startDate);
        }

        // Si tiene fecha de vencimiento, es activa si la fecha está entre el inicio y el fin (inclusive).
        // Se permite el registro hasta un día después de la fecha de vencimiento.
        if (targetDate >= startOfDay(startDate) && targetDate <= addDays(dueDate, 1)) {
            return true;
        }
        
        return false;

    } else if (task.type === 'habit') {
        if (targetDate < startOfDay(startDate)) {
            return false; // El hábito aún no ha comenzado.
        }

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
                return task.frequency_days?.includes(dayOfWeek) ?? false;
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
            format(parseISO(log.completion_date), 'yyyy-MM-dd') === dateString
        );

        return {
            ...task,
            completedToday: !!completionLog,
            // Aseguramos que `completion_date` refleje el log del día si existe.
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
        const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.life_prk_id === lifePrk.id && ap.progress !== null);
        
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

    // Fetch all habit tasks, including archived ones, to correctly calculate historical progress.
    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*');
    if (habitTasksError) throw habitTasksError;

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*');
    if (progressLogsError) throw progressLogsError;
    
    // --- Daily Tasks ---
    const habitTasksForDay = await getHabitTasksForDate(selectedDate, allHabitTasks, allProgressLogs);
    
    const { lifePrksWithProgress, areaPrksWithProgress } = calculateProgressForDate(selectedDate, lifePrks, areaPrks, habitTasksForDay);

    // --- Commitments (Weekly, Monthly, etc.) ---
    const commitments: HabitTask[] = [];


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
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch all necessary data for the entire month once
    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) throw lifePrksError;

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) throw areaPrksError;

    // Fetch all habit tasks, including archived ones, to let the logic handle visibility.
    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*');
    if (habitTasksError) throw habitTasksError;

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*').gte('completion_date', format(monthStart, 'yyyy-MM-dd')).lte('completion_date', format(monthEnd, 'yyyy-MM-dd'));
    if (progressLogsError) throw progressLogsError;

    // Calculate progress for each day of the month
    const dailyProgress: DailyProgressSnapshot[] = [];
    const habitTasksByDay: Record<string, HabitTask[]> = {};

    for (const day of daysInMonth) {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
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

        habitTasksByDay[format(day, 'yyyy-MM-dd')] = habitTasksForDay;
    }

    return {
        dailyProgress,
        habitTasks: habitTasksByDay,
        areaPrks, // Return areaPrks
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
