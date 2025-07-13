import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask } from "@/lib/types";

// Helper function to map Supabase data to our application types
// Supabase uses snake_case, our app uses camelCase
const mapAreaPrkFromDb = (dbData: any): AreaPrk => ({
    id: dbData.id,
    lifePrkId: dbData.life_prk_id,
    title: dbData.title,
    targetValue: dbData.target_value,
    currentValue: dbData.current_value,
    unit: dbData.unit,
    created_at: dbData.created_at,
    archived: dbData.archived
});

const mapHabitTaskFromDb = (dbData: any): HabitTask => ({
    id: dbData.id,
    areaPrkId: dbData.area_prk_id,
    title: dbData.title,
    type: dbData.type,
    completed: dbData.completed,
    value: dbData.value,
    created_at: dbData.created_at,
    archived: dbData.archived
});

export async function getDashboardData() {
    const supabase = createClient();

    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (lifePrksError) {
        console.error("Error fetching Life PRKs:", lifePrksError.message);
        throw new Error("Could not fetch Life PRKs.");
    }
    const lifePrks: LifePrk[] = (lifePrksData || []).map(lp => ({ ...lp, archived: lp.archived || false }));


    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (areaPrksError) {
        console.error("Error fetching Area PRKs:", areaPrksError.message);
        throw new Error("Could not fetch Area PRKs.");
    }
    const areaPrks: AreaPrk[] = areaPrksData.map(mapAreaPrkFromDb);


    const { data: habitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });

    if (habitTasksError) {
        console.error("Error fetching Habit/Tasks:", habitTasksError.message);
        throw new Error("Could not fetch Habit/Tasks.");
    }
    const habitTasks: HabitTask[] = habitTasksData.map(mapHabitTaskFromDb);

    return { lifePrks, areaPrks, habitTasks };
}
