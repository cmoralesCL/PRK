"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { suggestRelatedHabitsTasks } from "@/ai/flows/suggest-related-habits-tasks";
import { calculateDailyProgress } from "@/ai/flows/calculate-daily-progress";
import type { SuggestRelatedHabitsTasksInput } from "@/ai/flows/suggest-related-habits-tasks";
import type { AreaPrk, HabitTask, LifePrk, JournalEntry, LifePrkProgressPoint } from "@/lib/types";
import { getDashboardData } from "./server/queries";
import { subDays, format, eachDayOfInterval, startOfDay, parseISO } from "date-fns";


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
    await calculateDailyProgress({ startDate: new Date().toISOString().split('T')[0] });
    revalidatePath('/');
    revalidatePath('/journal');
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
    await calculateDailyProgress({ startDate: new Date().toISOString().split('T')[0] });
    revalidatePath('/');
    revalidatePath('/journal');
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
    const startDate = values.startDate || new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('habit_tasks').insert([{ 
        area_prk_id: values.areaPrkId,
        title: values.title,
        type: values.type,
        start_date: startDate,
        frequency: values.frequency,
        frequency_days: values.frequencyDays,
        due_date: values.dueDate,
        weight: values.weight || 1
    }]).select().single();

    if(error) throw error;
    await calculateDailyProgress({ startDate });
    revalidatePath('/');
    revalidatePath('/journal');
    return data as HabitTask;
}

export async function updateHabitTask(id: string, values: Partial<HabitTask>) {
    const supabase = createClient();
    const startDate = values.startDate || new Date().toISOString().split('T')[0];
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
    await calculateDailyProgress({ startDate });
    revalidatePath('/');
    revalidatePath('/journal');
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
    await calculateDailyProgress({ startDate: completionDate });
    revalidatePath('/');
    revalidatePath('/journal');
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
    
    await calculateDailyProgress({ startDate: completionDate });
    revalidatePath('/');
    revalidatePath('/journal');
}


export async function archiveLifePrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('life_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    await calculateDailyProgress({ startDate: new Date().toISOString().split('T')[0] });
    revalidatePath('/');
    revalidatePath('/journal');
}

export async function archiveAreaPrk(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('area_prks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    await calculateDailyProgress({ startDate: new Date().toISOString().split('T')[0] });
    revalidatePath('/');
    revalidatePath('/journal');
}

export async function archiveHabitTask(id: string) {
    const supabase = createClient();
    const { data } = await supabase.from('habit_tasks').select('start_date').eq('id', id).single();
    const startDate = data?.start_date || new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('habit_tasks').update({ archived: true }).eq('id', id);
    if(error) throw error;
    await calculateDailyProgress({ startDate });
    revalidatePath('/');
    revalidatePath('/journal');
}


export async function getJournalData(): Promise<JournalEntry[]> {
    const supabase = createClient();

    // Obtener todos los datos necesarios
    const { data: lifePrksData } = await supabase.from('life_prks').select('*').eq('archived', false);
    const { data: areaPrksData } = await supabase.from('area_prks').select('*').eq('archived', false);
    const { data: habitTasksData } = await supabase.from('habit_tasks').select('*').eq('archived', false);
    const { data: progressLogsData } = await supabase.from('progress_logs').select('*');

    if (!lifePrksData || !areaPrksData || !habitTasksData || !progressLogsData) {
        return [];
    }

    // Mapear para fácil acceso por ID
    const lifePrksMap = new Map(lifePrksData.map(lp => [lp.id, lp]));
    const areaPrksMap = new Map(areaPrksData.map(ap => [ap.id, ap]));
    const habitTasksMap = new Map(habitTasksData.map(ht => [ht.id, ht]));

    // Agrupar todas las finalizaciones por fecha
    const completionsByDate = new Map<string, any[]>();

    // Finalizaciones de tareas
    habitTasksData.forEach(ht => {
        if (ht.type === 'task' && ht.completion_date) {
            const date = ht.completion_date;
            if (!completionsByDate.has(date)) {
                completionsByDate.set(date, []);
            }
            completionsByDate.get(date)?.push({
                type: 'task',
                title: ht.title,
                areaPrkId: ht.area_prk_id
            });
        }
    });

    // Finalizaciones de hábitos
    progressLogsData.forEach(log => {
        const habitTask = habitTasksMap.get(log.habit_task_id);
        if (habitTask) {
            const date = log.completion_date;
            if (!completionsByDate.has(date)) {
                completionsByDate.set(date, []);
            }
            completionsByDate.get(date)?.push({
                type: 'habit',
                title: habitTask.title,
                areaPrkId: habitTask.area_prk_id
            });
        }
    });

    // Formatear los datos para el diario
    const journalEntries: JournalEntry[] = Array.from(completionsByDate.entries())
        .map(([date, completions]) => {
            const items = completions.map(comp => {
                const areaPrk = areaPrksMap.get(comp.areaPrkId);
                const lifePrk = areaPrk ? lifePrksMap.get(areaPrk.life_prk_id) : undefined;
                return {
                    type: comp.type,
                    title: comp.title,
                    areaPrkTitle: areaPrk?.title || 'Área desconocida',
                    lifePrkTitle: lifePrk?.title || 'Visión desconocida',
                };
            });
            return { date, items };
        })
        .sort((a, b) => b.date.localeCompare(a.date)); // Ordenar de más reciente a más antiguo

    return journalEntries;
}


export async function getLifePrkProgressData(dateRange?: { from: Date; to: Date }): Promise<{ chartData: LifePrkProgressPoint[], lifePrkNames: Record<string, string> }> {
  const supabase = createClient();
  const today = new Date();
  
  const fromDate = dateRange?.from ? startOfDay(dateRange.from) : subDays(today, 29);
  const toDate = dateRange?.to ? startOfDay(dateRange.to) : today;
  
  const fromDateStr = format(fromDate, 'yyyy-MM-dd');
  const toDateStr = format(toDate, 'yyyy-MM-dd');

  const { data: lifePrks, error: lifePrksError } = await supabase.from('life_prks').select('id, title').eq('archived', false);
  if (lifePrksError) throw lifePrksError;
  
  const lifePrkNames = lifePrks.reduce((acc, lp) => {
    acc[lp.id] = lp.title;
    return acc;
  }, {} as Record<string, string>);

  const { data: snapshotData, error: snapshotError } = await supabase
    .from('daily_progress_snapshots')
    .select('snapshot_date, life_prk_id, progress')
    .is('area_prk_id', null) // Only get life prk progress
    .gte('snapshot_date', fromDateStr)
    .lte('snapshot_date', toDateStr)
    .order('snapshot_date', { ascending: true });

  if (snapshotError) throw snapshotError;

  const chartDataMap = new Map<string, LifePrkProgressPoint>();
  eachDayOfInterval({ start: fromDate, end: toDate }).forEach(day => {
      const dateStr = format(day, 'MMM d');
      const dataPoint: LifePrkProgressPoint = { date: dateStr };
      lifePrks.forEach(lp => dataPoint[lp.id] = 0); // Initialize with 0
      chartDataMap.set(format(day, 'yyyy-MM-dd'), dataPoint);
  });

  snapshotData.forEach(snapshot => {
      const point = chartDataMap.get(snapshot.snapshot_date);
      if (point && snapshot.life_prk_id) {
          point[snapshot.life_prk_id] = snapshot.progress ?? 0;
      }
  });

  return { chartData: Array.from(chartDataMap.values()), lifePrkNames };
}
