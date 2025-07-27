
'use server';
import { createClient } from '@/lib/supabase/server';
import type { AreaPrk, HabitTask, ProgressLog } from '@/lib/types';
import { eachDayOfInterval, format, subDays, startOfDay, getDay } from 'date-fns';

const SIMULATION_START_DATE = new Date(2023, 0, 1); // January 1, 2023
const SIMULATION_END_DATE = new Date();

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

export async function seedDatabase(userId: string) {
    const supabase = createClient();
    console.log(`Starting database seed for user: ${userId}`);

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

    // 3. Define a set of habits and tasks to create
    const habitsToCreate: Omit<HabitTask, 'id' | 'created_at' | 'user_id' | 'area_prk_id' | 'archived_at'>[] = [
        // Salud y Bienestar Físico
        { area_prk_title: 'Mejorar Resistencia Cardiovascular', title: 'Correr 30 minutos', type: 'habit', frequency: 'SEMANAL_DIAS_FIJOS', frequency_days: ['L', 'X', 'V'], start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 3, is_critical: false, measurement_type: 'binary', archived: false },
        { area_prk_title: 'Optimizar la Calidad del Sueño', title: 'Meditar 10 minutos antes de dormir', type: 'habit', frequency: 'DIARIA', start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 2, is_critical: false, measurement_type: 'binary', archived: false },
        
        // Crecimiento Intelectual y Personal
        { area_prk_title: 'Hábito de Lectura Consistente', title: 'Leer 20 páginas', type: 'habit', frequency: 'DIARIA', start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 2, is_critical: false, measurement_type: 'quantitative', measurement_goal: { target_count: 365 * 20, unit: 'páginas' }, archived: false },
        
        // Finanzas Personales
        { area_prk_title: 'Construir Fondo de Emergencia', title: 'Revisar presupuesto semanal', type: 'habit', frequency: 'SEMANAL_DIAS_FIJOS', frequency_days: ['D'], start_date: format(SIMULATION_START_DATE, 'yyyy-MM-dd'), weight: 1, is_critical: false, measurement_type: 'binary', archived: false },

        // One-off tasks sprinkled throughout
        { area_prk_title: 'Dominar una Nueva Competencia Técnica', title: 'Inscribirme en el curso de IA', type: 'task', frequency: null, start_date: '2023-02-15', due_date: '2023-02-20', weight: 5, is_critical: true, measurement_type: 'binary', archived: false },
        { area_prk_title: 'Planificar y Realizar un Viaje Cultural', title: 'Comprar vuelos para el viaje', type: 'task', frequency: null, start_date: '2024-03-10', due_date: '2024-03-20', weight: 4, is_critical: false, measurement_type: 'binary', archived: false }
    ];

    console.log('Inserting new habit and task definitions...');
    const habitTaskInsertData = habitsToCreate.map(h => {
        const area_prk_id = areaPrkMap[h.area_prk_title as string];
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
    

    // 4. Generate progress logs
    console.log('Generating progress logs from 2023-01-01 to today...');
    const dateInterval = eachDayOfInterval({ start: SIMULATION_START_DATE, end: SIMULATION_END_DATE });
    const progressLogsToInsert: Omit<ProgressLog, 'id'|'created_at'>[] = [];

    for (const date of dateInterval) {
        for (const task of insertedHabitTasks) {
            if (isTaskActiveOnDateForSeed(task, date)) {
                // Simulate compliance - 75% chance of being completed
                const shouldComplete = Math.random() < 0.75;

                if (shouldComplete) {
                    let progressValue = 1;
                    let completionPercentage = 1.0;

                    if (task.measurement_type === 'quantitative') {
                        // Simulate a random value, e.g., between 15 and 25 pages
                        progressValue = Math.floor(Math.random() * 11) + 15;
                        completionPercentage = 1.0; // For quantitative, we log the value, not the % of a daily goal
                    }

                    progressLogsToInsert.push({
                        habit_task_id: task.id,
                        user_id: userId,
                        completion_date: format(date, 'yyyy-MM-dd'),
                        progress_value: progressValue,
                        completion_percentage: completionPercentage
                    });
                }
            }
        }
    }
    
    console.log(`Generated ${progressLogsToInsert.length} progress logs. Inserting into database...`);
    
    // Supabase has a limit on how many rows can be inserted at once, so we chunk it.
    const CHUNK_SIZE = 500;
    for (let i = 0; i < progressLogsToInsert.length; i += CHUNK_SIZE) {
        const chunk = progressLogsToInsert.slice(i, i + CHUNK_SIZE);
        const { error: logInsertError } = await supabase.from('progress_logs').insert(chunk);
        if (logInsertError) {
            console.error('Error inserting chunk:', logInsertError);
            throw new Error(`Failed to insert progress logs chunk: ${logInsertError.message}`);
        }
        console.log(`Inserted chunk ${i / CHUNK_SIZE + 1}...`);
    }

    console.log('Database seeding completed successfully!');
}
