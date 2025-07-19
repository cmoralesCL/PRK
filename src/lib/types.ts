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
  type: 'habit' | 'project' | 'task';
  created_at?: string;
  archived_at: string | null;
  
  start_date?: string; // Corresponds to start_date
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days' | null;
  frequency_days?: string[] | null; // Corresponds to frequency_days. ESTE ES EL CAMBIO CLAVE
  weight: number;

  due_date?: string | null; // Corresponds to due_date
  completion_date?: string | null; // Corresponds to completion_date

  completedToday?: boolean;

  is_critical: boolean; // Corresponds to is_critical
  
  // Este campo no existe en la BD, lo eliminamos.
  // commitment_period?: CommitmentPeriod | null; 

  // Campos para la medición de hábitos
  measurement_type?: 'binary' | 'quantitative' | 'temporal' | null;
  measurement_goal?: { target?: number; unit?: string; } | null; // Corresponds to measurement_goal
}

export interface ProgressLog {
  id: string;
  habit_task_id: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  
  progress_value?: number | null; // Corresponds to progress_value
  completion_percentage?: number | null; // Corresponds to completion_percentage
}

export interface DailyProgressSnapshot {
  id: string;
  snapshot_date: string;
  progress: number; // Almacenado como decimal (e.g., 0.75 para 75%)
}
