"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import type { AreaPrk, HabitTask, LifePrk } from "@/lib/types";

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

export async function addAreaPrk(values: { title: string; targetValue: number; unit: string; lifePrkId: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('area_prks').insert([{ 
        title: values.title,
        target_value: values.targetValue,
        unit: values.unit,
        life_prk_id: values.lifePrkId,
        current_value: 0
     }]).select().single();

    if(error) {
        console.error('Supabase error adding Area PRK:', error);
        throw error;
    }
    revalidatePath('/');
    return data as AreaPrk;
}

export async function addHabitTask(values: { title: string; type: 'habit' | 'task'; value: number; areaPrkId: string }) {
    const supabase = createClient();
    const { data, error } = await supabase.from('habit_tasks').insert([{ 
        title: values.title,
        type: values.type,
        value: values.value,
        area_prk_id: values.areaPrkId,
        completed: false 
    }]).select().single();

    if(error) throw error;
    revalidatePath('/');
    return data as HabitTask;
}

export async function toggleHabitTask(id: string, completed: boolean, areaPrkId: string, value: number) {
    const supabase = createClient();
    
    const { error: updateError } = await supabase
        .from('habit_tasks')
        .update({ completed })
        .eq('id', id);

    if (updateError) throw updateError;

    // Actualizar el valor actual del PRK de Área
    const { data: areaPrk, error: fetchError } = await supabase
        .from('area_prks')
        .select('current_value')
        .eq('id', areaPrkId)
        .single();
    
    if (fetchError) throw fetchError;

    const valueChange = completed ? value : -value;
    const newCurrentValue = Math.max(0, (areaPrk.current_value || 0) + valueChange);

    const { error: areaUpdateError } = await supabase
        .from('area_prks')
        .update({ current_value: newCurrentValue })
        .eq('id', areaPrkId);

    if (areaUpdateError) throw areaUpdateError;

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
