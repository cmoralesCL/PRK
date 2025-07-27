
'use server';
import { createClient } from '@/lib/supabase/server';
import type { HabitTask, ProgressLog } from '@/lib/types';
import { eachDayOfInterval, format, subDays, startOfDay, getDay, differenceInMonths, endOfWeek, isSameWeek, startOfWeek, endOfMonth, isSameMonth, startOfMonth, addDays } from 'date-fns';

// Updated date range to include future data for testing.
const SIMULATION_START_DATE = new Date(2023, 0, 1); // January 1, 2023
const SIMULATION_END_DATE = new Date(2025, 11, 31); // December 31, 2025


function isTaskActiveOnDateForSeed(task: HabitTask, date: Date): boolean {
    const targetDate = startOfDay(date);

    if (!task.start_date) return false;
    
    const startDate = startOfDay(new Date(task.start_date));
    if (targetDate < startDate) return false;

    if (task.archived && task.archived_at && targetDate > startOfDay(new Date(task.archived_at))) {
        return false;
    }
    
    if (task.due_date && targetDate > startOfDay(new Date(task.due_date))) {
        return false;
    }

    if (task.frequency?.includes('ACUMULATIVO')) {
        // We will handle these separately, not on a daily check basis for this simple seeder
        return false;
    }

    switch (task.frequency) {
        case 'DIARIA':
            return true;
        case 'SEMANAL_DIAS_FIJOS':
            const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
            const dayOfWeek = getDay(targetDate);
            return task.frequency_days?.includes(dayMap[dayOfWeek]) ?? false;
        case 'INTERVALO_DIAS':
            if (!task.frequency_interval) return false;
            const diffInMs = targetDate.getTime() - startDate.getTime();
            const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
            return diffInDays % task.frequency_interval === 0;
        default:
            return false;
    }
}

// Helper function to pick N random days from a week
function getRandomDaysOfWeek(days: Date[], count: number): Date[] {
    const shuffled = [...days].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export async function seedDatabase(userId: string) {
    const supabase = createClient();
    console.log(`Starting realistic database seed for user: ${userId}`);

    // 1. Clean up old seed data for this user to make the script idempotent
    console.log('Deleting existing progress logs for user...');
    await supabase.from('progress_logs').delete().eq('user_id', userId);
    console.log('Deleting existing habit_tasks for user...');
    await supabase.from('habit_tasks').delete().eq('user_id', userId);

    // 2. Fetch Area PRKs to associate tasks with
    console.log('Fetching Area PRKs...');
    const { data: areaPrks, error: areaPrksError } = await supabase
        .from('area_prks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('archived', false);

    if (areaPrksError) throw new Error(`Failed to fetch area PRKs: ${areaPrksError.message}`);
    if (!areaPrks || areaPrks.length === 0) {
        console.warn('No Area PRKs found for user. Aborting seed.');
        return;
    }
    console.log(`Found ${areaPrks.length} Area PRKs.`);
    
    const areaPrkMap: { [key: string]: string } = {};
    areaPrks.forEach(p => {
        areaPrkMap[p.title] = p.id;
    });

    // 3. Define a more diverse set of habits and tasks, including commitments
    const habitsToCreate: (Omit<HabitTask, 'id' | 'created_at' | 'user_id' | 'area_prk_id' | 'archived_at'> & { area_prk_title: string })[] = [
        // Daily habits
        { area_prk_title: 'Optimizar la Calidad del Sueño', title: 'Meditar 10 minutos antes de dormir', type: 'habit', frequency: 'DIARIA', start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 2, is_critical: false, measurement_type: 'binary', archived: false },
        { area_prk_title: 'Hábito de Lectura Consistente', title: 'Leer 20 páginas', type: 'habit', frequency: 'DIARIA', start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 2, is_critical: false, measurement_type: 'quantitative', measurement_goal: { target_count: 20, unit: 'páginas' }, archived: false },
        
        // Weekly fixed habits
        { area_prk_title: 'Construir Fondo de Emergencia', title: 'Revisar presupuesto semanal', type: 'habit', frequency: 'SEMANAL_DIAS_FIJOS', frequency_days: ['D'], start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 1, is_critical: false, measurement_type: 'binary', archived: false },

        // Weekly commitments (accumulative)
        { area_prk_title: 'Mejorar Resistencia Cardiovascular', title: 'Hacer ejercicio (3x semana)', type: 'habit', frequency: 'SEMANAL_ACUMULATIVO', measurement_type: 'binary', measurement_goal: { target_count: 3 }, start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 3, is_critical: false, archived: false },

        // Monthly commitments (accumulative)
        { area_prk_title: 'Fortalecer Vínculos Familiares', title: 'Organizar actividad familiar', type: 'habit', frequency: 'MENSUAL_ACUMULATIVO', measurement_type: 'binary', measurement_goal: { target_count: 1 }, start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 4, is_critical: false, archived: false },

        // One-off tasks sprinkled throughout
        { area_prk_title: 'Dominar una Nueva Competencia Técnica', title: 'Inscribirme en el curso de IA', type: 'task', frequency: null, start_date: '2023-02-15', due_date: '2023-02-20', weight: 5, is_critical: true, measurement_type: 'binary', archived: false, completion_date: '2023-02-18' },
        { area_prk_title: 'Planificar y Realizar un Viaje Cultural', title: 'Comprar vuelos para el viaje', type: 'task', frequency: null, start_date: '2024-03-10', due_date: '2024-03-20', weight: 4, is_critical: false, measurement_type: 'binary', archived: false, completion_date: '2024-03-15' }
    ];

    console.log('Inserting new habit and task definitions...');
    const habitTaskInsertData = habitsToCreate.map(h => {
        const area_prk_id = areaPrkMap[h.area_prk_title];
        if (!area_prk_id) {
            console.warn(`Could not find Area PRK for title: "${h.area_prk_title}", skipping task "${h.title}"`);
            return null;
        }
        const { area_prk_title, ...rest } = h;
        return { ...rest, user_id: userId, area_prk_id };
    }).filter(Boolean);
    
    const { data: insertedHabitTasks, error: habitInsertError } = await supabase
        .from('habit_tasks')
        .insert(habitTaskInsertData as any)
        .select();

    if (habitInsertError) throw new Error(`Failed to insert habits: ${habitInsertError.message}`);
    console.log(`Inserted ${insertedHabitTasks.length} new habits/tasks.`);
    

    // 4. Generate progress logs with realistic, ascending compliance
    console.log('Generating realistic progress logs from 2023-01-01 to 2025-12-31...');
    const dateInterval = eachDayOfInterval({ start: SIMULATION_START_DATE, end: SIMULATION_END_DATE });
    const progressLogsToInsert: Omit<ProgressLog, 'id'|'created_at'>[] = [];
    
    const totalMonthsInSimulation = differenceInMonths(SIMULATION_END_DATE, SIMULATION_START_DATE);

    for (const date of dateInterval) {
        const monthsPassed = differenceInMonths(date, SIMULATION_START_DATE);
        
        // Ascending compliance rate: starts at 50% and increases to a max of 90%
        const baseCompliance = 0.50;
        const maxCompliance = 0.90;
        const complianceGrowth = (maxCompliance - baseCompliance) / (totalMonthsInSimulation || 1);
        const currentComplianceRate = Math.min(baseCompliance + (monthsPassed * complianceGrowth), maxCompliance);
        let dayHasLogs = false;

        // Handle daily fixed tasks
        for (const task of insertedHabitTasks.filter(t => !t.frequency?.includes('ACUMULATIVO') && t.type === 'habit')) {
            if (isTaskActiveOnDateForSeed(task, date)) {
                // Ensure at least one daily task is logged to meet the "data every day" requirement
                if (Math.random() < currentComplianceRate || (!dayHasLogs && task.frequency === 'DIARIA')) {
                    let progressValue = 1;
                    let completionPercentage = 1.0;

                    if (task.measurement_type === 'quantitative') {
                        // Simulate a random value with slight variation, e.g., 80% to 120% of goal
                        const target = task.measurement_goal?.target_count ?? 20;
                        progressValue = Math.floor(target * (0.8 + Math.random() * 0.4));
                        completionPercentage = progressValue / target;
                    }

                    progressLogsToInsert.push({
                        habit_task_id: task.id, user_id: userId, completion_date: format(date, 'yyyy-MM-dd'),
                        progress_value: progressValue, completion_percentage: completionPercentage
                    });
                    dayHasLogs = true;
                }
            }
        }
        
        // Handle one-off completed tasks
        for (const task of insertedHabitTasks.filter(t => t.type === 'task' && t.completion_date)) {
             if (format(new Date(task.completion_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
                 progressLogsToInsert.push({
                    habit_task_id: task.id, user_id: userId, completion_date: task.completion_date,
                    progress_value: 1, completion_percentage: 1.0
                });
             }
        }

        // Handle weekly accumulative commitments - process at the end of each week
        if (getDay(date) === 0) { // Sunday, end of the week for date-fns `isSameWeek` default
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = date; // Process for the week ending on the current day
            const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

            for (const task of insertedHabitTasks.filter(t => t.frequency === 'SEMANAL_ACUMULATIVO')) {
                 if (date >= new Date(task.start_date!)) {
                     const target = task.measurement_goal?.target_count ?? 1;
                     const numToComplete = Math.round(target * currentComplianceRate); // How many times they did it this week
                     const completionDays = getRandomDaysOfWeek(daysInWeek, numToComplete);

                     for(const completionDay of completionDays) {
                         progressLogsToInsert.push({
                            habit_task_id: task.id, user_id: userId, completion_date: format(completionDay, 'yyyy-MM-dd'),
                            progress_value: 1, completion_percentage: 1.0
                         });
                     }
                 }
            }
        }

        // Handle monthly accumulative commitments - process at the end of each month
        if (endOfMonth(date).getDate() === date.getDate()) { // Last day of the month
             const monthStart = startOfMonth(date);
             const daysInMonth = eachDayOfInterval({ start: monthStart, end: date });

             for (const task of insertedHabitTasks.filter(t => t.frequency === 'MENSUAL_ACUMULATIVO')) {
                  if (date >= new Date(task.start_date!)) {
                    const target = task.measurement_goal?.target_count ?? 1;
                    if (Math.random() < currentComplianceRate) { // Decide if they achieve the monthly goal at all
                        const completionDays = getRandomDaysOfWeek(daysInMonth, target); // Pick random day(s) in the month
                         for(const completionDay of completionDays) {
                             progressLogsToInsert.push({
                                habit_task_id: task.id, user_id: userId, completion_date: format(completionDay, 'yyyy-MM-dd'),
                                progress_value: 1, completion_percentage: 1.0
                            });
                         }
                    }
                  }
             }
        }
    }
    
    console.log(`Generated ${progressLogsToInsert.length} realistic progress logs. Inserting into database...`);
    
    // Supabase has a limit on how many rows can be inserted at once, so we chunk it.
    const CHUNK_SIZE = 500;
    for (let i = 0; i < progressLogsToInsert.length; i += CHUNK_SIZE) {
        const chunk = progressLogsToInsert.slice(i, i + CHUNK_SIZE);
        const { error: logInsertError } = await supabase.from('progress_logs').insert(chunk);
        if (logInsertError) {
            console.error('Error inserting chunk:', logInsertError);
            throw new Error(`Failed to insert progress logs chunk: ${logInsertError.message}`);
        }
        console.log(`Inserted chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(progressLogsToInsert.length / CHUNK_SIZE)}...`);
    }

    console.log('Database seeding completed successfully!');
}
