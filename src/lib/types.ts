

export interface LifePrk {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  archived: boolean;
  progress?: number; // Representa el progreso general del día, para la UI.
}

export interface AreaPrk {
  id: string;
  life_prk_id: string; // Corresponds to life_prk_id in Supabase
  title: string;
  // targetValue y currentValue ya no son la fuente principal de progreso
  target_value: number; 
  current_value: number;
  unit: string;
  created_at?: string;
  archived: boolean;
  progress?: number | null; // El progreso ahora se calcula a nivel de LifePrk/Día.
}

export type CommitmentPeriod = 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export interface HabitTask {
  id: string;
  area_prk_id: string; // Corresponds to area_prk_id in Supabase
  title: string;
  description?: string | null;
  type: 'habit' | 'project' | 'task';
  created_at?: string;
  archived_at?: string | null;
  
  start_date?: string; // Corresponds to start_date
  
  // Frequency for interval-based habits
  frequency?: 'daily' 
    | 'specific_days' 
    | 'every_x_days'
    | 'every_x_weeks'
    | 'every_x_months'
    | 'specific_day_of_month'
    | 'weekly' // Represents a weekly commitment
    | 'monthly' // Represents a monthly commitment
    | null;

  frequency_interval?: number | null; // For 'every_x...' frequencies
  frequency_days?: string[] | null; // For 'specific_days' or 'every_x_weeks' on specific days
  frequency_day_of_month?: number | null; // For 'specific_day_of_month'
  
  weight: number;

  due_date?: string | null; // Corresponds to due_date
  completion_date?: string | null; // Corresponds to completion_date

  completedToday?: boolean;
  current_progress_value?: number | null;

  is_critical: boolean; // Corresponds to is_critical
  
  // Campos para la medición de hábitos
  measurement_type?: 'binary' | 'quantitative' | null;
  measurement_goal?: { target?: number; unit?: string; } | null; // Corresponds to measurement_goal
}

export interface ProgressLog {
  id: string;
  habit_task_id: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  progress_value?: number | null; // Corresponds to progress_value
  completion_percentage: number | null;
}

export interface DailyProgressSnapshot {
  id: string;
  snapshot_date: string;
  progress: number; // Almacenado como decimal (e.g., 0.75 para 75%)
}

export interface WeeklyProgressSnapshot {
  id: string; // Will be the start date of the week 'yyyy-MM-dd'
  progress: number;
}
