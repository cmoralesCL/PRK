import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";

// Helper para mapear snake_case a camelCase para HabitTask
const mapHabitTaskFromDb = (dbData: any): HabitTask => ({
    id: dbData.id,
    areaPrkId: dbData.area_prk_id,
    title: dbData.title,
    type: dbData.type,
    created_at: dbData.created_at,
    archived: dbData.archived,
    startDate: dbData.start_date,
    frequency: dbData.frequency,
    frequencyDays: dbData.frequency_days,
    weight: dbData.weight,
});

export async function getDashboardData() {
    const supabase = createClient();

    // 1. Obtener los PRK de Vida no archivados
    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    // 2. Obtener los PRK de Área no archivados
    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    // 3. Obtener los Hábitos/Tareas no archivados
    const { data: habitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    // 4. Obtener todos los registros de progreso
    const { data: progressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs')
        .select('*');

    if (progressLogsError) throw new Error("Could not fetch progress logs.");


    // 5. Calcular progreso para cada nivel usando las funciones de PostgreSQL
    const lifePrks: LifePrk[] = await Promise.all(lifePrksData.map(async (lp) => {
        const { data, error } = await supabase.rpc('fn_calculate_life_prk_progress', { p_life_prk_id: lp.id });
        if (error) console.error(`Error calculating progress for Life PRK ${lp.id}:`, error.message);
        return { ...lp, archived: lp.archived || false, progress: data ?? 0 };
    }));

    const areaPrks: AreaPrk[] = await Promise.all(areaPrksData.map(async (ap) => {
        const { data, error } = await supabase.rpc('fn_calculate_area_prk_progress', { p_area_prk_id: ap.id });
        if (error) console.error(`Error calculating progress for Area PRK ${ap.id}:`, error.message);
        return { 
            id: ap.id,
            lifePrkId: ap.life_prk_id,
            title: ap.title,
            targetValue: ap.target_value,
            currentValue: ap.current_value,
            unit: ap.unit,
            created_at: ap.created_at,
            archived: ap.archived,
            progress: data ?? 0
        };
    }));

    const habitTasks: HabitTask[] = await Promise.all(habitTasksData.map(async (ht) => {
        let progress = 0;
        if (ht.type === 'task') {
            const { data, error } = await supabase.rpc('fn_calculate_task_progress', { p_task_id: ht.id });
            if (error) console.error(`Error calculating progress for Task ${ht.id}:`, error.message);
            progress = data ?? 0;
        } else {
            const { data, error } = await supabase.rpc('fn_calculate_habit_progress', { p_habit_id: ht.id });
            if (error) console.error(`Error calculating progress for Habit ${ht.id}:`, error.message);
            progress = data ?? 0;
        }

        const today = new Date().toISOString().split('T')[0];
        const completedToday = progressLogsData.some(log => log.habit_task_id === ht.id && log.completion_date === today);

        return { ...mapHabitTaskFromDb(ht), progress, completedToday };
    }));
    

    return { lifePrks, areaPrks, habitTasks };
}
