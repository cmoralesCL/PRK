export type ColorTheme = 'mint' | 'sapphire' | 'amethyst' | 'coral' | 'rose' | 'solar';

export interface LifePrk {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at?: string;
  archived: boolean;
  progress?: number; // Representa el progreso general del día, para la UI.
  color_theme?: ColorTheme;
}

export interface AreaPrk {
  id: string;
  user_id: string;
  life_prk_id: string; // Corresponds to life_prk_id in Supabase
  title: string;
  description?: string | null;
  // targetValue y currentValue ya no son la fuente principal de progreso
  target_value: number; 
  current_value: number;
  unit: string;
  created_at?: string;
  archived: boolean;
  progress: number; // El progreso ahora se calcula a nivel de LifePrk/Día.
  monthlyProgress: number;
}

export type CommitmentPeriod = 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export type HabitFrequency = 
  | 'UNICA'
  | 'DIARIA'
  | 'SEMANAL_DIAS_FIJOS'
  | 'MENSUAL_DIA_FIJO'
  | 'ANUAL_FECHA_FIJA'
  | 'INTERVALO_DIAS'
  | 'INTERVALO_SEMANAL_DIAS_FIJOS'
  | 'INTERVALO_MENSUAL_DIA_FIJO'
  | 'SEMANAL_ACUMULATIVO'
  | 'MENSUAL_ACUMULATIVO'
  | 'TRIMESTRAL_ACUMULATIVO'
  | 'ANUAL_ACUMULATIVO'
  | 'SEMANAL_ACUMULATIVO_RECURRENTE'
  | 'MENSUAL_ACUMULATIVO_RECURRENTE'
  | 'TRIMESTRAL_ACUMULATIVO_RECURRENTE';


export interface HabitTask {
  id: string;
  user_id: string;
  area_prk_ids: string[]; // Replaces area_prk_id
  title: string;
  description?: string | null;
  type: 'habit' | 'task';
  created_at?: string;
  archived: boolean;
  archived_at?: string | null;
  
  start_date?: string; // Corresponds to start_date
  
  frequency?: HabitFrequency | null;
  
  frequency_unit?: 'days' | 'weeks' | 'months' | null; // For 'INTERVALO'
  frequency_interval?: number | null; // For 'INTERVALO' and '*_RECURRENTE'
  frequency_days?: string[] | null; // For 'SEMANAL_ESPECIFICO'
  frequency_day_of_month?: number | null; // For 'MENSUAL_DIA_FIJO'
  
  weight: number;

  due_date?: string | null; // Corresponds to due_date
  completion_date?: string | null; // Corresponds to completion_date

  completedToday?: boolean;
  current_progress_value?: number | null;

  is_critical: boolean; // Corresponds to is_critical
  
  // Campos para la medición de hábitos
  measurement_type?: 'binary' | 'quantitative' | null;
  measurement_goal?: { target_count?: number; unit?: string; } | null; // Corresponds to measurement_goal
  
  // UI-specific fields, not in DB
  logs?: ProgressLog[];
}

export interface ProgressLog {
  id: string;
  user_id: string;
  habit_task_id: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  progress_value?: number | null; // Corresponds to progress_value
  completion_percentage: number | null;
}

export interface DailyProgressSnapshot {
  snapshot_date: string;
  progress: number; // Almacenado como decimal (e.g., 0.75 para 75%)
  user_id?: string;
  id?: string;
}

export interface WeeklyProgressSnapshot {
  id: string; // Will be the start date of the week 'yyyy-MM-dd'
  progress: number;
}


export interface KpiData {
  todayProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
  prevMonthProgress: number;
  semesterProgress: number;
  annualProgress: number;
  dailyProgressChartData: { date: string; Progreso: number }[];
  monthlyProgressChartData: { month: string; Progreso: number }[];
}


export type AnalyticsData = {
  stats: {
    overallProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    quarterlyProgress: number;
    lifePrksCount: number;
    areaPrksCount: number;
    tasksCompleted: number;
  };
  areaPrks: (AreaPrk & { progress: number; monthlyProgress: number })[];
  progressOverTime: {
    weekly: { date: string; Progreso: number }[];
    monthly: { date: string; Progreso: number }[];
    quarterly: { date: string; Progreso: number }[];
    yearly: { date: string; Progreso: number }[];
  };
  // Data for filters
  lifePrks: LifePrk[];
  allAreaPrks: AreaPrk[];
  allHabitTasks: HabitTask[];
}
