"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import type { AreaPrk, HabitTask, LifePrk } from "@/lib/types";
import { getLifePrkProgressData as getLifePrkProgressDataQuery } from "./server/queries";


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
        description: values.description || '' 
    }]).select().single();

    if(error) throw error;
    revalidatePath('/');
    return data as LifePrk;
}

export async function addAreaPrk(values: { title: string; unit: string; lifePrkId: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('area_prks').insert([{ 
        title: values.title,
        unit: values.unit,
        life_prk_id: values.lifePrkId,
        target_value: 100, // No se usa para el cálculo pero se mantiene por estructura
        current_value: 0
     }]).select().single();

    if(error) {
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
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
    const { data, error } = await supabase.from('habit_tasks').insert([{ 
        area_prk_id: values.areaPrkId,
        title: values.title,
        type: values.type,
        start_date: values.startDate || new Date().toISOString().split('T')[0],
        frequency: values.frequency,
        frequency_days: values.frequencyDays,
        due_date: values.dueDate,
        weight: values.weight || 1
    }]).select().single();

    if(error) throw error;
    revalidatePath('/');
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
      })
      .eq('id', id)
      .select()
      .single();
  
    if (error) throw error;
    revalidatePath('/');
    return data as HabitTask;
}

export async function logHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'task', completionDate: string) {
    const supabase = createClient();

    if (type === 'task') {
        const { error } = await supabase
            .from('habit_tasks')
            .update({ completion_date: completionDate })
            .eq('id', habitTaskId);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('progress_logs').insert([{
            habit_task_id: habitTaskId,
            completion_date: completionDate
        }]);
        if (error) throw error;
    }
    revalidatePath('/');
}

export async function removeHabitTaskCompletion(habitTaskId: string, type: 'habit' | 'task', completionDate: string) {
    const supabase = createClient();

    if (type === 'task') {
        const { error } = await supabase
            .from('habit_tasks')
            .update({ completion_date: null })
            .eq('id', habitTaskId);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('progress_logs')
            .delete()
            .eq('habit_task_id', habitTaskId)
            .eq('completion_date', completionDate);

        if (error) {
            console.warn(`Could not find a log to delete for habit ${habitTaskId} on ${completionDate}:`, error.message);
        }
    }
    
    revalidatePath('/');
}

export async function archiveLifePrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('life_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
}

export async function archiveAreaPrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('area_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
}

export async function archiveHabitTask(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('habit_tasks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    revalidatePath('/');
}

export async function getLifePrkProgressData(dateRange?: { from: Date, to: Date }) {
    return getLifePrkProgressDataQuery(dateRange);
}
