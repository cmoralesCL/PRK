// ts-node generate-seed-inserts.ts
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { eachDayOfInterval, format, differenceInMonths, getDay, startOfWeek } from 'date-fns';
import fs from 'fs';
import path from 'path';
import type { HabitTask } from './src/lib/types';

// Cargar variables de entorno desde el archivo .env
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Service Role Key is not defined in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// === CONFIGURACIÓN ===
const USER_UUID = '7de8c686-4712-4111-9f37-e5590d40a2b2';
const SIMULATION_START_DATE = new Date('2024-01-01');
const SIMULATION_END_DATE = new Date('2025-12-31');
const INITIAL_COMPLIANCE_RATE = 0.4; // 40%
const FINAL_COMPLIANCE_RATE = 0.9;   // 90%
const OUTPUT_FILE_PATH = path.join(__dirname, 'seed-data.sql');

// Función para obtener días aleatorios de una semana
function getRandomDaysOfWeek(days: Date[], count: number): Date[] {
    const shuffled = [...days].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function generateSeedFile() {
  console.log('Starting seed data generation...');
  
  // 1. Obtener todas las tareas y hábitos del usuario
  console.log(`Fetching habit_tasks for user ${USER_UUID}...`);
  const { data: habitTasks, error } = await supabase
    .from('habit_tasks')
    .select('*')
    .eq('user_id', USER_UUID)
    .eq('archived', false);

  if (error) {
    console.error('Error fetching habit tasks:', error);
    return;
  }
  if (!habitTasks || habitTasks.length === 0) {
    console.log('No habit tasks found for this user. Nothing to generate.');
    return;
  }
  console.log(`Found ${habitTasks.length} tasks to process.`);

  const allInserts: string[] = [];
  const dateInterval = eachDayOfInterval({ start: SIMULATION_START_DATE, end: SIMULATION_END_DATE });
  const totalDays = dateInterval.length;

  allInserts.push(`-- Generated SQL INSERT statements for user: ${USER_UUID}`);
  allInserts.push(`-- Simulation period: ${format(SIMULATION_START_DATE, 'yyyy-MM-dd')} to ${format(SIMULATION_END_DATE, 'yyyy-MM-dd')}`);
  allInserts.push(`\n-- Cleaning up previous logs for this user`);
  allInserts.push(`DELETE FROM public.progress_logs WHERE user_id = '${USER_UUID}';`);
  allInserts.push(`UPDATE public.habit_tasks SET completion_date = NULL WHERE user_id = '${USER_UUID}' AND type = 'task';\n`);

  const oneOffTasksToComplete: { id: string; completion_date: string }[] = [];

  // 2. Generar logs para cada día
  for (const currentDate of dateInterval) {
    const daysPassed = dateInterval.findIndex(d => d.getTime() === currentDate.getTime());
    const currentComplianceRate = INITIAL_COMPLIANCE_RATE + (FINAL_COMPLIANCE_RATE - INITIAL_COMPLIANCE_RATE) * (daysPassed / totalDays);

    for (const task of habitTasks as HabitTask[]) {
      const startDate = new Date(task.start_date!);
      const dueDate = task.due_date ? new Date(task.due_date) : null;

      if (currentDate < startDate || (dueDate && currentDate > dueDate)) {
        continue;
      }
      
      const isDailyOrFixedDay = task.frequency === 'DIARIA' ||
        (task.frequency === 'SEMANAL_DIAS_FIJOS' && task.frequency_days?.includes(['D', 'L', 'M', 'X', 'J', 'V', 'S'][getDay(currentDate)])) ||
        (task.frequency === 'MENSUAL_DIA_FIJO' && currentDate.getDate() === task.frequency_day_of_month);

      if (isDailyOrFixedDay) {
        if (Math.random() < currentComplianceRate) {
          if (task.measurement_type === 'quantitative') {
            const target = task.measurement_goal?.target_count ?? 1;
            const value = Math.floor(target * (0.8 + Math.random() * 0.4));
            const percentage = value / target;
            allInserts.push(`INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage) VALUES ('${USER_UUID}', '${task.id}', '${format(currentDate, 'yyyy-MM-dd')}', ${value}, ${percentage});`);
          } else {
            allInserts.push(`INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage) VALUES ('${USER_UUID}', '${task.id}', '${format(currentDate, 'yyyy-MM-dd')}', 1, 1.0);`);
          }
        }
      }

      if (task.frequency === 'SEMANAL_ACUMULATIVO' && getDay(currentDate) === 0) { // Sunday
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: currentDate });
        const target = task.measurement_goal?.target_count ?? 1;
        const numToComplete = Math.round(target * currentComplianceRate);
        const completionDays = getRandomDaysOfWeek(daysInWeek, numToComplete);
        for (const day of completionDays) {
           allInserts.push(`INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage) VALUES ('${USER_UUID}', '${task.id}', '${format(day, 'yyyy-MM-dd')}', 1, 1.0);`);
        }
      }
      
      if (task.type === 'task' && !task.frequency) {
         if (Math.random() < 0.05) { // Small chance each day to complete it
            let completionDate = currentDate;
            if (dueDate && completionDate > dueDate) {
                completionDate = dueDate;
            }
            oneOffTasksToComplete.push({ id: task.id, completion_date: format(completionDate, 'yyyy-MM-dd') });
         }
      }
    }
  }
  
  // Add unique one-off task completions
  const completedTaskIds = new Set();
  for (const taskToComplete of oneOffTasksToComplete) {
    if (!completedTaskIds.has(taskToComplete.id)) {
        allInserts.push(`\n-- Completing one-off task`);
        allInserts.push(`UPDATE public.habit_tasks SET completion_date = '${taskToComplete.completion_date}' WHERE id = '${taskToComplete.id}';`);
        allInserts.push(`INSERT INTO public.progress_logs (user_id, habit_task_id, completion_date, progress_value, completion_percentage) VALUES ('${USER_UUID}', '${taskToComplete.id}', '${taskToComplete.completion_date}', 1, 1.0);`);
        completedTaskIds.add(taskToComplete.id);
    }
  }


  // 3. Escribir al archivo
  fs.writeFileSync(OUTPUT_FILE_PATH, allInserts.join('\n'));
  console.log(`\n✅ Success!`);
  console.log(`Generated ${allInserts.length} SQL statements in ${OUTPUT_FILE_PATH}`);
  console.log(`You can now copy the content of this file and run it in your Supabase SQL Editor.`);
}

generateSeedFile();
