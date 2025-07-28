


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { suggestRelatedHabitsTasks, type SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import { LifePrk, AreaPrk, HabitTask, ProgressLog, DailyProgressSnapshot, WeeklyProgressSnapshot, KpiData } from "@/lib/types";
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
    subMonths,
    areIntervalsOverlapping,
    differenceInWeeks,
    differenceInMonths,
    differenceInDays,
    isAfter,
    isBefore,
    endOfYear,
    subDays,
    eachWeekOfInterval,
    eachMonthOfInterval,
    isFirstDayOfMonth,
    endOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { logError } from "@/lib/logger";
import { redirect } from "next/navigation";


async function getCurrentUserId(): Promise<string> {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.error('User not authenticated, redirecting to login.');
        redirect('/login');
    }
    return user.id;
}


export async function login(formData: FormData) {
    const supabase = createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error('Login error:', error.message);  
      redirect("/login?message=Could not authenticate user");
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function loginAsGuest() {
  const supabase = createClient();

  const data = {
    email: "test@example.com",
    password: "password",
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error('Guest login error:', error.message);
    redirect("/login?message=No se pudo iniciar sesión como invitado. Asegúrate de que el usuario 'test@example.com' exista.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}


export async function signup(formData: FormData) {
    const origin = headers().get("origin");
    const supabase = createClient();
    
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signUp(data, {
      emailRedirectTo: `${origin}/auth/callback`,
    });

    if (error) {
      console.error('Signup error:', error.message);
      redirect("/login?message=Could not authenticate user");
    }

    redirect("/login?message=Check email to continue sign in process");
}


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
    const userId = await getCurrentUserId();
    try {
        const { data, error } = await supabase.from('life_prks').insert([{ 
            title: values.title, 
            description: values.description || '',
            user_id: userId,
        }]).select();

        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'addLifePrk', values });
        console.error("Error adding Life PRK:", error);
        throw error;
    }
    revalidatePath('/panel');
}

export async function updateLifePrk(id: string, values: { title: string; description?: string }) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { error } = await supabase
            .from('life_prks')
            .update({ 
                title: values.title, 
                description: values.description || '',
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'updateLifePrk', id, values });
        console.error("Error updating Life PRK:", error);
        throw error;
    }
    revalidatePath('/panel');
}

export async function addAreaPrk(values: { title: string; description?: string, life_prk_id: string }) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { data, error } = await supabase.from('area_prks').insert([{ 
            title: values.title,
            description: values.description || '',
            unit: '%', // Hardcode default unit
            life_prk_id: values.life_prk_id,
            target_value: 100,
            current_value: 0,
            user_id: userId,
         }]).select();

        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'addAreaPrk', values });
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/panel');
}

export async function updateAreaPrk(id: string, values: { title: string; description?: string }) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { error } = await supabase
            .from('area_prks')
            .update({ 
                title: values.title,
                description: values.description || '',
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'updateAreaPrk', id, values });
        console.error('Supabase error updating Area PRK:', error);
        throw error;
    }
    revalidatePath('/panel');
}

export async function addHabitTask(values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived_at' | 'archived'>>) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    
    const dataToInsert: any = { ...values, user_id: userId };

    if (dataToInsert.frequency === 'UNICA') {
        dataToInsert.frequency = null;
    }

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
    revalidatePath('/panel');
    revalidatePath('/calendar');
}

export async function updateHabitTask(id: string, values: Partial<Omit<HabitTask, 'id' | 'created_at' | 'archived' | 'archived_at' | 'user_id'>>): Promise<void> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    
    const updateData: any = { ...values };

    if (updateData.frequency === 'UNICA') {
        updateData.frequency = null;
    }

    try {
        const { error } = await supabase
            .from('habit_tasks')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            await logError(error, { at: 'updateHabitTask', id, values: updateData });
            throw error;
        }
    } catch (error) {
        console.error("Error updating Habit/Task:", error);
        throw error;
    }

    revalidatePath('/panel');
    revalidatePath('/calendar');
}

export async function logHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'task', completionDate: string, progressValue?: number) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        if (type === 'task' && !progressValue) {
            // Only mark one-off tasks as completed if no progress value is given
            const { data: taskDetails, error: taskError } = await supabase.from('habit_tasks').select('frequency').eq('id', habitTaskId).eq('user_id', userId).single();
            if (taskError) throw taskError;
            if (!taskDetails.frequency) {
                 const { error: updateError } = await supabase
                    .from('habit_tasks')
                    .update({ completion_date: completionDate })
                    .eq('id', habitTaskId)
                    .eq('user_id', userId);
                if (updateError) throw updateError;
            }
        }

        let completionPercentage = 1.0; 

        if (progressValue !== undefined) {
            const { data: task, error: taskError } = await supabase
                .from('habit_tasks')
                .select('measurement_goal, measurement_type, frequency')
                .eq('id', habitTaskId)
                .eq('user_id', userId)
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
            user_id: userId,
        };
        
        const { error: logErrorObj } = await supabase.from('progress_logs').upsert(
            upsertData, 
            { onConflict: 'habit_task_id, completion_date' }
        );

        if (logErrorObj) throw logErrorObj;

        revalidatePath('/panel');
        revalidatePath('/calendar');
        revalidatePath('/dashboard');
    } catch (error) {
        await logError(error, { at: 'logHabitTaskCompletion', habitTaskId, completionDate, progressValue });
        console.error('Error in logHabitTaskCompletion:', error);
        throw new Error('Failed to log task completion.');
    }
}

export async function removeHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'task', completionDate: string) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        if (type === 'task') {
             const { data: taskDetails, error: taskError } = await supabase.from('habit_tasks').select('frequency').eq('id', habitTaskId).eq('user_id', userId).single();
            if (taskError) throw taskError;
            if (!taskDetails.frequency) {
                 const { error } = await supabase
                    .from('habit_tasks')
                    .update({ completion_date: null })
                    .eq('id', habitTaskId)
                    .eq('user_id', userId);
                if (error) throw error;
            }
        }
        
        const { error } = await supabase
            .from('progress_logs')
            .delete()
            .eq('habit_task_id', habitTaskId)
            .eq('completion_date', completionDate)
            .eq('user_id', userId);

        if (error) {
            console.warn(`Could not find a log to delete for habit ${habitTaskId} on ${completionDate}:`, error.message);
        }
        
        revalidatePath('/panel');
        revalidatePath('/calendar');
        revalidatePath('/dashboard');
    } catch (error) {
        await logError(error, { at: 'removeHabitTaskCompletion', habitTaskId, completionDate });
        console.error('Error in removeHabitTaskCompletion:', error);
        throw new Error('Failed to remove task completion log.');
    }
}

export async function archiveLifePrk(id: string) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { error } = await supabase.from('life_prks').update({ archived: true }).eq('id', id).eq('user_id', userId);
        if(error) throw error;
    } catch (error) {
        await logError(error, { at: 'archiveLifePrk', id });
        console.error("Error archiving life prk:", error);
        throw new Error("Failed to archive life prk.");
    }
    revalidatePath('/panel');
    revalidatePath('/calendar');
}

export async function archiveAreaPrk(id: string) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { error } = await supabase.from('area_prks').update({ archived: true }).eq('id', id).eq('user_id', userId);
        if(error) throw error;
    } catch(error) {
        await logError(error, { at: 'archiveAreaPrk', id });
        console.error("Error archiving area prk:", error);
        throw new Error("Failed to archive area prk.");
    }
    revalidatePath('/panel');
    revalidatePath('/calendar');
}

export async function archiveHabitTask(id: string, archiveDate: string) {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    try {
        const { error } = await supabase
            .from('habit_tasks')
            .update({ archived: true, archived_at: archiveDate })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        await logError(error, { at: 'archiveHabitTask', id, archiveDate });
        console.error("Error archiving habit/task:", error);
        if (error instanceof Error) {
            throw error; // Re-throw the specific error message
        }
        throw new Error("Failed to archive habit/task.");
    }

    revalidatePath('/panel');
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
    
    // A one-off task with no frequency is active only on its start date, regardless of completion.
    if (task.frequency === null || task.frequency === 'UNICA') {
        const isCompleted = !!task.completion_date;
        if (isCompleted) {
            // If completed, only show it on its completion date, not after.
            return isSameDay(targetDate, startOfDay(parseISO(task.completion_date)));
        }
        // If not completed, it's active on or after start date, until due date (if any)
        const endDate = task.due_date ? startOfDay(parseISO(task.due_date)) : null;
        if (isAfter(targetDate, startDate) && !endDate) {
            // One-off task with no due date becomes "overdue" but remains active
            return true;
        }
        return isWithinInterval(targetDate, { start: startDate, end: endDate || addDays(startDate, 365 * 10) }); // Show for a long time if no due date
    }
    
    // Must be on or after start date for recurring tasks
    if (isBefore(targetDate, startDate)) {
        return false;
    }
    
    // If it's a recurring task/habit, it can't be active past its due_date.
    const endDate = task.due_date ? startOfDay(parseISO(task.due_date)) : null;
    if (endDate && isAfter(targetDate, endDate)) {
        return false;
    }

    // --- Frequency Logic (applies to both tasks and habits) ---
    // Frequencies for commitments should not appear on the calendar
    if (task.frequency.includes('ACUMULATIVO')) {
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
            completion_date: completionLog ? dateString : ((task.type === 'task' && !task.frequency) ? task.completion_date : undefined),
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
            if (task.measurement_type === 'quantitative' && task.measurement_goal?.target_count) {
                // Allow overachievement by not capping the progress.
                const progressPercentage = (task.current_progress_value ?? 0) / task.measurement_goal.target_count;
                return sum + (progressPercentage * task.weight);
            }
            if (task.completedToday) {
                 // For binary tasks, progress is 1 (100%)
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
    const userId = await getCurrentUserId();
    const selectedDate = parseISO(selectedDateString);

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (lifePrksError) {
        await logError(lifePrksError, {at: 'getDashboardData - lifePrks'});
        throw lifePrksError;
    };

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (areaPrksError) {
        await logError(areaPrksError, {at: 'getDashboardData - areaPrks'});
        throw areaPrksError;
    }

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('user_id', userId);
    if (habitTasksError) {
        await logError(habitTasksError, {at: 'getDashboardData - allHabitTasks'});
        throw habitTasksError;
    }

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*').eq('user_id', userId);
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


async function calculateWeeklyProgress(
    weekStart: Date,
    allHabitTasks: HabitTask[],
    allProgressLogs: ProgressLog[],
    habitTasksByDay: Record<string, HabitTask[]>
): Promise<number> {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let totalWeightedProgress = 0;
    let totalWeight = 0;

    // 1. Daily tasks progress
    weekDays.forEach(d => {
        const dayString = format(d, 'yyyy-MM-dd');
        const tasks = habitTasksByDay[dayString] ?? [];
        if (tasks.length > 0) {
            tasks.forEach(task => {
                let progressPercentage = 0;
                if (task.measurement_type === 'quantitative') {
                    const target = task.measurement_goal?.target_count ?? 1;
                    progressPercentage = target > 0 ? ((task.current_progress_value ?? 0) / target) : 0;
                } else if (task.completedToday) {
                    progressPercentage = 1;
                }
                totalWeightedProgress += Math.min(progressPercentage, 1) * task.weight;
                totalWeight += task.weight;
            });
        }
    });

    // 2. Weekly commitments progress
    const weeklyCommitmentTasks = getActiveCommitments(allHabitTasks, allProgressLogs, weekStart)
        .filter(c => c.frequency?.startsWith('SEMANAL_ACUMULATIVO'));

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
    
    return combinedAvgProgress > 100 ? 100 : combinedAvgProgress;
}


export async function getCalendarData(monthDate: Date) {
    const supabase = createClient();
    const userId = await getCurrentUserId();

    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const daysInView = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (lifePrksError) {
        await logError(lifePrksError, {at: 'getCalendarData - lifePrks'});
        throw lifePrksError;
    }

    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (areaPrksError) {
        await logError(areaPrksError, {at: 'getCalendarData - areaPrks'});
        throw areaPrksError;
    }

    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('user_id', userId);
    if (habitTasksError) {
        await logError(habitTasksError, {at: 'getCalendarData - allHabitTasks'});
        throw habitTasksError;
    }

    const { data: allProgressLogs, error: progressLogsError } = await supabase.from('progress_logs').select('*').eq('user_id', userId).gte('completion_date', format(calendarStart, 'yyyy-MM-dd')).lte('completion_date', format(calendarEnd, 'yyyy-MM-dd'));
    if (progressLogsError) {
        await logError(progressLogsError, {at: 'getCalendarData - allProgressLogs'});
        throw progressLogsError;
    }

    const dailyProgress: DailyProgressSnapshot[] = [];
    const habitTasksByDay: Record<string, HabitTask[]> = {};

    for (const day of daysInView) {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
        habitTasksByDay[format(day, 'yyyy-MM-dd')] = habitTasksForDay;

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
                user_id: userId,
            });
        }
    }
    
    const commitments = getActiveCommitments(allHabitTasks, allProgressLogs, monthDate)
        .map(task => {
            let periodStartForLogs: Date, periodEndForLogs: Date;
            
            const freq = task.frequency;
            
            if(freq?.startsWith('SEMANAL')) {
                periodStartForLogs = startOfWeek(monthDate, { weekStartsOn: 1 });
                periodEndForLogs = endOfWeek(monthDate, { weekStartsOn: 1 });
            } else if (freq?.startsWith('MENSUAL')) {
                periodStartForLogs = startOfMonth(monthDate);
                periodEndForLogs = endOfMonth(monthDate);
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
        const progress = await calculateWeeklyProgress(weekStart, allHabitTasks, allProgressLogs, habitTasksByDay);

        weeklyProgress.push({
            id: format(weekStart, 'yyyy-MM-dd'),
            progress: progress,
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
            let progressPercentage = 0;
            if (task.measurement_type === 'quantitative') {
                const target = task.measurement_goal?.target_count ?? 1;
                progressPercentage = target > 0 ? ((task.current_progress_value ?? 0) / target) : 0;
            } else if (task.completedToday) {
                progressPercentage = 1;
            }
            totalMonthlyWeightedProgress += Math.min(progressPercentage, 1) * task.weight;
            totalMonthlyWeight += task.weight;
        });
    });
    
    // Accumulative commitments for the month
    const monthlyCommitments = getActiveCommitments(allHabitTasks, allProgressLogs, monthStart);
    
    monthlyCommitments.forEach(task => {
        if (!task.frequency || !task.start_date) return;
        
        const target = task.measurement_goal?.target_count ?? 1;
        let periodProgress = 0;

        if (task.frequency.startsWith('SEMANAL')) {
            let weekStart = startOfWeek(monthStart, {weekStartsOn: 1});
            let weeksInPeriod = 0;
            let totalWeeklyProgress = 0;

            while(weekStart <= monthEnd) {
                const weekEnd = endOfWeek(weekStart, {weekStartsOn: 1});
                
                const isActiveThisWeek = getActiveCommitments([task], [], weekStart).length > 0;
                if (!isActiveThisWeek) {
                    weekStart = addDays(weekStart, 7);
                    continue;
                }

                weeksInPeriod++;

                const logs = allProgressLogs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: weekStart, end: weekEnd }));
                let weekCompletionPercentage = 0;
                if (task.measurement_type === 'quantitative') {
                    const totalValue = logs.reduce((sum, log) => sum + (log.progress_value ?? 0), 0);
                    weekCompletionPercentage = target > 0 ? (totalValue / target) : 0;
                } else if (task.measurement_type === 'binary') {
                    const completions = logs.length;
                    weekCompletionPercentage = target > 0 ? (completions / target) : 0;
                }
                totalWeeklyProgress += Math.min(weekCompletionPercentage, 1);
                weekStart = addDays(weekStart, 7);
            }
            if(weeksInPeriod > 0) periodProgress = totalWeeklyProgress / weeksInPeriod;

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

/**
 * Calculates the weighted progress for a set of tasks within a given date range.
 * This is the CORE progress calculation logic.
 * @param tasks The tasks to calculate progress for.
 * @param logs The progress logs for the relevant period.
 * @param startDate The start date of the period.
 * @param endDate The end date of the period.
 * @returns The calculated progress percentage, capped at 100.
 */
function calculatePeriodProgress(tasks: HabitTask[], logs: ProgressLog[], startDate: Date, endDate: Date): number {
    let totalWeightedProgress = 0;
    let totalPossibleWeight = 0;

    const activeTasks = tasks.filter(task => {
        if (!task.start_date) return false;
        const taskStartDate = parseISO(task.start_date);
        if (isAfter(taskStartDate, endDate)) return false;
        if (task.archived && task.archived_at && isBefore(parseISO(task.archived_at), startDate)) return false;
        if (task.due_date && isBefore(parseISO(task.due_date), startDate)) return false;
        const taskEndDate = task.due_date ? parseISO(task.due_date) : new Date(8640000000000000);
        return areIntervalsOverlapping({ start: startDate, end: endDate }, { start: taskStartDate, end: taskEndDate }, { inclusive: true });
    });

    activeTasks.forEach(task => {
        const taskWeight = task.weight || 1;
        let periodAchievedProgress = 0;
        let opportunityCount = 0;

        // --- Handle Daily/Scheduled Tasks ---
        if (!task.frequency?.includes('ACUMULATIVO')) {
            const daysInPeriod = eachDayOfInterval({ start: startDate, end: endDate });
            const activeDays = daysInPeriod.filter(day => isTaskActiveOnDate(task, day));
            opportunityCount = activeDays.length;

            if (opportunityCount > 0) {
                const periodLogs = logs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: startDate, end: endDate }));
                
                if (task.measurement_type === 'quantitative') {
                    const totalValue = periodLogs.reduce((sum, log) => sum + (log.progress_value ?? 0), 0);
                    const totalTarget = (task.measurement_goal?.target_count ?? 1) * opportunityCount;
                    periodAchievedProgress = totalTarget > 0 ? totalValue / totalTarget : 0;
                } else { // binary and one-off
                    periodAchievedProgress = periodLogs.length / opportunityCount;
                }
                 totalWeightedProgress += periodAchievedProgress * taskWeight;
                 totalPossibleWeight += taskWeight;
            }
        } 
        // --- Handle Accumulative Tasks ---
        else {
             let periodProgress = 0;
            if (task.frequency.startsWith('SEMANAL')) {
                const weeksInPeriod = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
                let totalWeeklyProgress = 0;
                
                for (const week of weeksInPeriod) {
                    if (getActiveCommitments([task], [], week).length > 0) {
                        opportunityCount++;
                        const weekLogs = logs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), { start: week, end: endOfWeek(week, {weekStartsOn: 1}) }));
                        const target = task.measurement_goal?.target_count ?? 1;
                        let weekProgress = 0;
                        if (task.measurement_type === 'quantitative') {
                            const totalValue = weekLogs.reduce((sum, l) => sum + (l.progress_value ?? 0), 0);
                            weekProgress = target > 0 ? totalValue / target : 0;
                        } else {
                            weekProgress = target > 0 ? weekLogs.length / target : 0;
                        }
                        totalWeeklyProgress += Math.min(weekProgress, 1);
                    }
                }
                if (opportunityCount > 0) {
                    periodProgress = totalWeeklyProgress / opportunityCount;
                }

            } else if (task.frequency.startsWith('MENSUAL')) {
                 const monthsInPeriod = eachMonthOfInterval({ start: startDate, end: endDate });
                 for (const month of monthsInPeriod) {
                    if (getActiveCommitments([task],[], month).length > 0) {
                        opportunityCount++;
                        const monthLogs = logs.filter(log => log.habit_task_id === task.id && isWithinInterval(parseISO(log.completion_date), {start: month, end: endOfMonth(month)}));
                        const target = task.measurement_goal?.target_count ?? 1;
                        let monthProgress = 0;
                        if (task.measurement_type === 'quantitative') {
                            const totalValue = monthLogs.reduce((sum, l) => sum + (l.progress_value ?? 0), 0);
                            monthProgress = target > 0 ? totalValue / target : 0;
                        } else {
                            monthProgress = target > 0 ? monthLogs.length / target : 0;
                        }
                         periodProgress += Math.min(monthProgress, 1);
                    }
                 }
                 if(opportunityCount > 0) periodProgress = periodProgress / opportunityCount;

            }
             // NOTE: Not handling TRIMESTRAL/ANUAL for simplicity in this iteration
            if (opportunityCount > 0) {
                totalWeightedProgress += periodProgress * taskWeight;
                totalPossibleWeight += taskWeight;
            }
        }
    });

    if (totalPossibleWeight === 0) return 0;

    const progress = (totalWeightedProgress / totalPossibleWeight) * 100;
    return progress > 100 ? 100 : progress;
}


export async function getDashboardKpiData(dateString: string): Promise<KpiData> {
    const supabase = createClient();
    const userId = await getCurrentUserId();
    const today = parseISO(dateString);

    // Fetch all tasks for the user once
    const { data: allHabitTasks, error: habitTasksError } = await supabase.from('habit_tasks').select('*').eq('user_id', userId);
    if (habitTasksError) throw habitTasksError;

    // Determine the widest date range needed for all calculations
    const annualStart = startOfYear(today);
    const thirtyDaysAgo = subDays(today, 29);
    const overallStartDate = thirtyDaysAgo < annualStart ? thirtyDaysAgo : annualStart;

    // Fetch all progress logs within that wide range
    const { data: allProgressLogs, error: progressLogsError } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('completion_date', format(overallStartDate, 'yyyy-MM-dd'))
        .lte('completion_date', format(endOfYear(today), 'yyyy-MM-dd'));
    if (progressLogsError) throw progressLogsError;
    
    // Fetch life and area prks
    const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (lifePrksError) throw lifePrksError;
    const { data: areaPrks, error: areaPrksError } = await supabase.from('area_prks').select('*').eq('archived', false).eq('user_id', userId);
    if (areaPrksError) throw areaPrksError;

    // Helper to calculate progress and round it
    const calculateAndRound = (startDate: Date, endDate: Date) => {
        const periodLogs = allProgressLogs.filter(log => isWithinInterval(parseISO(log.completion_date), { start: startDate, end: endDate }));
        const progress = calculatePeriodProgress(allHabitTasks, periodLogs, startDate, endDate);
        return Math.round(progress > 100 ? 100 : progress);
    };

    // Calculate all KPIs for specific periods
    const todayProgress = calculateAndRound(startOfDay(today), endOfDay(today));
    const weeklyProgress = calculateAndRound(startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }));
    const monthlyProgress = calculateAndRound(startOfMonth(today), endOfMonth(today));
    
    const prevMonth = subMonths(today, 1);
    const prevMonthProgress = calculateAndRound(startOfMonth(prevMonth), endOfMonth(prevMonth));
    
    const semesterStart = await startOfSemester(today);
    const semesterEnd = await endOfSemester(today);
    const semesterProgress = calculateAndRound(semesterStart, semesterEnd);

    const annualStartOfYear = startOfYear(today);
    const annualEndOfYear = endOfYear(today);
    const annualProgress = calculateAndRound(annualStartOfYear, annualEndOfYear);

    // --- Calculate 30-day chart data ---
    const chartDateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const dailyProgressChartData: { date: string; Progreso: number }[] = [];

    for (const day of chartDateRange) {
        const habitTasksForDay = await getHabitTasksForDate(day, allHabitTasks, allProgressLogs);
        
        if (habitTasksForDay.length > 0) {
            const { lifePrksWithProgress } = calculateProgressForDate(day, lifePrks, areaPrks, habitTasksForDay);
            
            const relevantLifePrks = lifePrksWithProgress.filter(lp => lp.progress !== null);
            const overallProgress = relevantLifePrks.length > 0
                ? relevantLifePrks.reduce((sum, lp) => sum + (lp.progress ?? 0), 0) / relevantLifePrks.length
                : 0;
            
            dailyProgressChartData.push({
                date: format(day, 'd'), // Just the day number
                Progreso: Math.round(overallProgress > 100 ? 100 : overallProgress),
            });
        } else {
             dailyProgressChartData.push({
                date: format(day, 'd'),
                Progreso: 0,
            });
        }
    }
    
    return {
        todayProgress,
        weeklyProgress,
        monthlyProgress,
        prevMonthProgress,
        semesterProgress,
        annualProgress,
        dailyProgressChartData,
    };
}
