
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import { LifePrk, AreaPrk, HabitTask, ProgressLog, DailyProgressSnapshot } from "@/lib/types";
import { format, startOfDay, parseISO, getDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';


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

export async function addAreaPrk(values: { title: string; unit: string; life_prk_id: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('area_prks').insert([{ 
        title: values.title,
        unit: values.unit,
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

export async function addHabitTask(values: Partial<HabitTask>) {
    const supabase = createClient();
    const { data, error } = await supabase.from('habit_tasks').insert([{ 
        area_prk_id: values.areaPrkId,
        title: values.title,
        type: values.type,
        start_date: values.startDate || new Date().toISOString().split('T')[0],
        frequency: values.frequency,
        frequency_days: values.frequencyDays,
        due_date: values.dueDate,
        weight: values.weight || 1,
        is_critical: values.isCritical,
        measurement_type: values.measurementType,
        measurement_goal: values.measurementGoal,
    }]);

    if(error) {
        console.error("Error adding Habit/Task:", error);
        throw error;
    }
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function updateHabitTask(id: string, values: Partial<HabitTask>): Promise<void> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('habit_tasks')
      .update({
        title: values.title,
        type: values.type,
        start_date: values.startDate,
        due_date: values.dueDate,
        frequency: values.frequency,
        frequency_days: values.frequencyDays,
        weight: values.weight,
        is_critical: values.isCritical,
        measurement_type: values.measurementType,
        measurement_goal: values.measurementGoal
      })
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
        const { error } = await supabase.from('habit_tasks').update({ archived: true }).eq('id', id);
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
    if (!task.startDate) {
        return false; // No puede estar activa si no tiene fecha de inicio.
    }
    const startDate = parseISO(task.startDate);
    const targetDate = startOfDay(date);

    if (targetDate < startOfDay(startDate)) {
        return false; // La tarea aún no ha comenzado.
    }

    if (task.type === 'task' || task.type === 'project') {
        const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
        // La tarea es visible si está dentro de su rango O si no tiene fecha de vencimiento y ya empezó.
        // Se muestra hasta un día después de su fecha de vencimiento o finalización para permitir el registro tardío.
        const completionDate = task.completionDate ? parseISO(task.completionDate) : null;
        
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

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('archived', false);
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
    };
}
