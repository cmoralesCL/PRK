
'use server';

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { suggestRelatedHabitsTasks, type SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import { HabitTask, ProgressLog } from "@/lib/types";
import { SimpleTask } from "@/lib/simple-tasks-types";
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
}


// --- Simple Tasks Actions ---

export async function getSimpleTasks(): Promise<SimpleTask[]> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('simple_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    await logError(error, { at: 'getSimpleTasks' });
    console.error("Error fetching simple tasks:", error);
    return [];
  }
  return data;
}

export async function addSimpleTask(title: string, dueDate?: string | null): Promise<void> {
  if (!title) {
    throw new Error('Title is required');
  }
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('simple_tasks')
    .insert({ title, user_id: userId, is_completed: false, due_date: dueDate });

  if (error) {
    await logError(error, { at: 'addSimpleTask', title });
    console.error("Error adding simple task:", error);
    throw new Error('Failed to add task.');
  }
  revalidatePath('/tasks');
}

export async function updateSimpleTaskCompletion(id: string, is_completed: boolean): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('simple_tasks')
    .update({ is_completed })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    await logError(error, { at: 'updateSimpleTaskCompletion', id, is_completed });
    console.error("Error updating simple task:", error);
    throw new Error('Failed to update task.');
  }
  revalidatePath('/tasks');
}

export async function deleteSimpleTask(id: string): Promise<void> {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('simple_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    await logError(error, { at: 'deleteSimpleTask', id });
    console.error("Error deleting simple task:", error);
    throw new Error('Failed to delete task.');
  }
  revalidatePath('/tasks');
}
