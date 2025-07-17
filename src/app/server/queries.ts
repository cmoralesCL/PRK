import { createClient } from "@/lib/supabase/server";
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";
import { startOfDay, parseISO, isEqual, isAfter, format } from 'date-fns';

// Helper to map snake_case to camelCase for HabitTask
const mapHabitTaskFromDb = (dbData: any): HabitTask => ({
    id: dbData.id,
    areaPrkId: dbData.area_prk_id,
    title: dbData.title,
    type: dbData.type,
    created_at: dbData.created_at,
    archived: dbData.archived,
    startDate: dbData.start_date,
    dueDate: dbData.due_date,
    completionDate: dbData.completion_date,
    frequency: dbData.frequency,
    frequencyDays: dbData.frequency_days,
    weight: dbData.weight,
});

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

const mapLifePrkFromDb = (dbData: any): LifePrk => ({
    id: dbData.id,
    title: dbData.title,
    description: dbData.description,
    created_at: dbData.created_at,
    archived: dbData.archived,
});


export async function getDashboardData(selectedDateStr: string) {
    const supabase = createClient();
    const selectedDate = startOfDay(parseISO(selectedDateStr));
    const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');

    // --- 1. Fetch all raw data ---
    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (lifePrksError) throw new Error("Could not fetch Life PRKs.");

    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (areaPrksError) throw new Error("Could not fetch Area PRKs.");

    // Fetch only tasks relevant for display logic
    const { data: allHabitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (habitTasksError) throw new Error("Could not fetch Habit/Tasks.");
    
    // Fetch progress snapshots for the selected date
    const { data: snapshotData, error: snapshotError } = await supabase
        .from('daily_progress_snapshots')
        .select('*')
        .eq('snapshot_date', selectedDateFormatted);
    if(snapshotError) throw new Error(`Could not fetch progress snapshots: ${snapshotError.message}`);

    // --- 2. Assemble data using snapshots ---

    const lifePrksWithProgress = lifePrksData.map(lp => {
        const snapshot = snapshotData.find(s => s.life_prk_id === lp.id && s.area_prk_id === null);
        return {
            ...mapLifePrkFromDb(lp),
            progress: snapshot?.progress ?? 0
        };
    });

    const areaPrksWithProgress = areaPrksData.map(ap => {
        const snapshot = snapshotData.find(s => s.area_prk_id === ap.id);
        return {
            ...mapAreaPrkFromDb(ap),
            progress: snapshot?.progress ?? 0
        };
    });

    // --- 3. Determine which tasks to display ---
    const { data: progressLogsForDay, error: progressLogsError } = await supabase
        .from('progress_logs').select('habit_task_id')
        .eq('completion_date', selectedDateFormatted);
    if(progressLogsError) throw new Error("Could not fetch daily progress logs.");
    
    const completedHabitIdsToday = new Set(progressLogsForDay.map(p => p.habit_task_id));

    const habitTasksForDisplay = allHabitTasksData
        .map(mapHabitTaskFromDb)
        .filter(ht => {
            const startDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
            return !isAfter(startDate, selectedDate);
        })
        .map(ht => {
            let completedToday = false;
            if (ht.type === 'task') {
                completedToday = ht.completionDate ? isEqual(startOfDay(parseISO(ht.completionDate)), selectedDate) : false;
            } else {
                completedToday = completedHabitIdsToday.has(ht.id);
            }
            return { ...ht, completedToday };
        })
        .filter(ht => {
             if (ht.type === 'task' && ht.completionDate) {
                 // Hide if it was completed on a day before the selected date
                 return isAfter(startOfDay(parseISO(ht.completionDate)), selectedDate) || isEqual(startOfDay(parseISO(ht.completionDate)), selectedDate)
             }
             return true;
        });
    
    return { 
        lifePrks: lifePrksWithProgress, 
        areaPrks: areaPrksWithProgress, 
        habitTasks: habitTasksForDisplay 
    };
}
