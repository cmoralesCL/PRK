"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import type { AreaPrk, HabitTask, LifePrk } from "@/lib/types";
import { getLifePrkProgressData as getLifePrkProgressDataQuery, getCalendarData as getCalendarDataQuery } from "./server/queries";


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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.from('life_prks').insert([{ 
        title: values.title, 
        description: values.description || '',
    }]).select().single();

    if(error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
    revalidatePath('/journal');
    return data as LifePrk;
}

export async function addAreaPrk(values: { title: string; unit: string; lifePrkId: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.from('area_prks').insert([{ 
        title: values.title,
        unit: values.unit,
        life_prk_id: values.lifePrkId,
        target_value: 100,
        current_value: 0,
        user_id: user.id
     }]).select().single();

    if(error) {
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
    revalidatePath('/calendar');
    const typedData: AreaPrk = {
      id: data.id,
      lifePrkId: data.life_prk_id,
      title: data.title,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      created_at: data.created_at,
      archived: data.archived
    }
    return typedData;
}

export async function addHabitTask(values: Partial<HabitTask>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

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
        user_id: user.id
    }]).select().single();

    if(error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
    return data as HabitTask;
}

export async function updateHabitTask(id: string, values: Partial<HabitTask>) {
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
      .eq('id', id)
      .select()
      .single();
  
    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
    return data as HabitTask;
}

export async function logHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'project' | 'task', completionDate: string) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        
        if (type === 'project' || type === 'task') {
            const { error } = await supabase
                .from('habit_tasks')
                .update({ completion_date: completionDate })
                .eq('id', habitTaskId);
            if (error) throw error;
        } 

        const { error: logError } = await supabase.from('progress_logs').insert([{
            habit_task_id: habitTaskId,
            completion_date: completionDate,
            progress_value: null, 
            completion_percentage: 1.0, // 100%
            user_id: user.id
        }]);

        if (logError) throw logError;

        revalidatePath('/');
        revalidatePath('/calendar');
        revalidatePath('/journal');
    } catch (error) {
        console.error('Error in logHabitTaskCompletion:', error);
        throw new Error('Failed to log task completion.');
    }
}

export async function removeHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'project' | 'task', completionDate: string) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");


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
        revalidatePath('/journal');
    } catch (error) {
        console.error('Error in removeHabitTaskCompletion:', error);
        throw new Error('Failed to remove task completion log.');
    }
}


export async function archiveLifePrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('life_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
    revalidatePath('/journal');
}

export async function archiveAreaPrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('area_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function archiveHabitTask(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('habit_tasks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
    revalidatePath('/calendar');
}

export async function getLifePrkProgressData(options: { from: Date, to: Date, timeRange: TimeRangeOption }) {
    return getLifePrkProgressDataQuery(options);
}

export async function getCalendarData(date: Date) {
    return getCalendarDataQuery(date);
}
