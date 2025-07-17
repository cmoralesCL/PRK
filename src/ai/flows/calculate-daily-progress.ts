'use server';
/**
 * @fileOverview A flow to calculate and store daily progress snapshots.
 *
 * - calculateDailyProgress - A function that calculates progress for a given date range and stores it.
 * - CalculateDailyProgressInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { eachDayOfInterval, format, startOfDay, parseISO, isAfter, isBefore, isEqual, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';
import type { LifePrk, AreaPrk, HabitTask, ProgressLog } from "@/lib/types";

const CalculateDailyProgressInputSchema = z.object({
  startDate: z.string().describe("The start date for recalculating progress, in YYYY-MM-DD format."),
});
export type CalculateDailyProgressInput = z.infer<typeof CalculateDailyProgressInputSchema>;

export async function calculateDailyProgress(input: CalculateDailyProgressInput): Promise<void> {
    await calculateDailyProgressFlow(input);
}


// This isn't a "real" AI flow, but we use the flow structure to run it as a background task.
const calculateDailyProgressFlow = ai.defineFlow(
  {
    name: 'calculateDailyProgressFlow',
    inputSchema: CalculateDailyProgressInputSchema,
    outputSchema: z.void(),
  },
  async ({ startDate }) => {
    const supabase = createClient();

    // 1. Fetch all necessary raw data once
    const { data: lifePrksData, error: lifePrksError } = await supabase
        .from('life_prks').select('*').eq('archived', false);
    if (lifePrksError) throw new Error(`Could not fetch Life PRKs: ${lifePrksError.message}`);

    const { data: areaPrksData, error: areaPrksError } = await supabase
        .from('area_prks').select('*').eq('archived', false);
    if (areaPrksError) throw new Error(`Could not fetch Area PRKs: ${areaPrksError.message}`);

    const { data: allHabitTasksData, error: habitTasksError } = await supabase
        .from('habit_tasks').select('*').eq('archived', false);
    if (habitTasksError) throw new Error(`Could not fetch Habit/Tasks: ${habitTasksError.message}`);
    
    const { data: allProgressLogsData, error: progressLogsError } = await supabase
        .from('progress_logs').select('*, habit_task_id');
    if (progressLogsError) throw new Error(`Could not fetch progress logs: ${progressLogsError.message}`);

    // Define the date range for recalculation
    const calculationStartDate = startOfDay(parseISO(startDate));
    const calculationEndDate = startOfDay(new Date()); // Up to today
    const dateRange = eachDayOfInterval({ start: calculationStartDate, end: calculationEndDate });

    // 2. Iterate through each day in the range and calculate progress
    for (const date of dateRange) {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const mappedProgressLogs: ProgressLog[] = allProgressLogsData
            .map(p => ({
                id: p.id,
                habitTaskId: p.habit_task_id,
                completion_date: p.completion_date,
            }))
            .filter(p => p.completion_date);

        const allHabitTasksWithProgress: (HabitTask & { progress: number })[] = allHabitTasksData.map(ht => {
            let progress = 0;
            const htStartDate = ht.start_date ? startOfDay(parseISO(ht.start_date)) : new Date(0);

            if (isAfter(htStartDate, date)) {
                 return { ...mapHabitTaskFromDb(ht), progress: 0 };
            }

            if (ht.type === 'task') {
                const completionDate = ht.completion_date ? startOfDay(parseISO(ht.completion_date)) : null;
                progress = completionDate && !isAfter(completionDate, date) ? 100 : 0;
            } else {
                progress = calculateHabitProgress(mapHabitTaskFromDb(ht), mappedProgressLogs, date);
            }
            return { ...mapHabitTaskFromDb(ht), progress };
        });

        const areaPrksWithProgress: (AreaPrk & { progress: number })[] = areaPrksData.map(ap => {
            const relevantHabitTasks = allHabitTasksWithProgress.filter(ht => {
                 const htStartDate = ht.startDate ? startOfDay(parseISO(ht.startDate)) : new Date(0);
                 if (isAfter(htStartDate, date)) {
                     return false;
                 }
                 return ht.areaPrkId === ap.id;
            });

            let progress = 0;
            if (relevantHabitTasks.length > 0) {
                const totalProgress = relevantHabitTasks.reduce((sum, ht) => sum + (ht.progress ?? 0), 0);
                progress = totalProgress / relevantHabitTasks.length;
            } else {
                progress = 100;
            }

            return {
                ...mapAreaPrkFromDb(ap),
                progress,
            };
        });

        const lifePrksWithProgress: (LifePrk & { progress: number })[] = lifePrksData.map(lp => {
            const relevantAreaPrks = areaPrksWithProgress.filter(ap => ap.lifePrkId === lp.id);
            let progress = 0;
            if (relevantAreaPrks.length > 0) {
                const totalProgress = relevantAreaPrks.reduce((sum, ap) => sum + (ap.progress ?? 0), 0);
                progress = totalProgress / relevantAreaPrks.length;
            } else {
                progress = 100;
            }
            return {
                ...lp,
                archived: lp.archived || false,
                progress,
            };
        });

        // 3. Upsert the calculated progress into the snapshot table
        const snapshotData = [
            ...lifePrksWithProgress.map(lp => ({
                snapshot_date: dateStr,
                life_prk_id: lp.id,
                area_prk_id: null,
                progress: lp.progress
            })),
            ...areaPrksWithProgress.map(ap => ({
                snapshot_date: dateStr,
                life_prk_id: ap.lifePrkId,
                area_prk_id: ap.id,
                progress: ap.progress
            }))
        ];
        
        const { error: upsertError } = await supabase
            .from('daily_progress_snapshots')
            .upsert(snapshotData, { onConflict: 'snapshot_date, life_prk_id, area_prk_id' });

        if (upsertError) {
            console.error(`Failed to upsert progress for ${dateStr}:`, upsertError);
            throw new Error(`Failed to upsert progress for ${dateStr}: ${upsertError.message}`);
        }
    }
  }
);


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

const calculateHabitProgress = (habit: HabitTask, logs: ProgressLog[], selectedDate: Date): number => {
    if (!habit.startDate || !habit.frequency) return 0;

    const startDate = startOfDay(parseISO(habit.startDate));
    if (isAfter(startDate, selectedDate)) return 0;
    
    switch (habit.frequency) {
        case 'daily':
            const completedOnSelectedDate = logs.some(log => 
                log.habitTaskId === habit.id && 
                log.completion_date && 
                isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
            return completedOnSelectedDate ? 100 : 0;
        case 'weekly': {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday
            
            const completionInWeek = logs.some(log => {
                if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, weekStart) && !isAfter(logDate, weekEnd);
            });

            return completionInWeek ? 100 : 0;
        }
        case 'monthly': {
            const startOfPeriod = startOfMonth(selectedDate);
            const completionsInPeriod = logs.filter(log => {
                if (!log.completion_date || log.habitTaskId !== habit.id) return false;
                const logDate = startOfDay(parseISO(log.completion_date));
                return !isBefore(logDate, startOfPeriod) && !isAfter(logDate, selectedDate);
            }).length;
            return completionsInPeriod > 0 ? 100 : 0;
        }
        case 'specific_days': {
             if (!habit.frequencyDays || habit.frequencyDays.length === 0) return 0;
             const completedOnDay = logs.some(log => 
                log.habitTaskId === habit.id && 
                log.completion_date && 
                isEqual(startOfDay(parseISO(log.completion_date)), selectedDate)
            );
             return completedOnDay ? 100 : 0;
        }
        default:
            return 0;
    }
}
