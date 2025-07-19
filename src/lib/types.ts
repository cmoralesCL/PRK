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
  lifePrkId: string; // Corresponds to life_prk_id in Supabase
  title: string;
  // targetValue y currentValue ya no son la fuente principal de progreso
  targetValue: number; 
  currentValue: number;
  unit: string;
  created_at?: string;
  archived: boolean;
  progress?: number | null; // El progreso ahora se calcula a nivel de LifePrk/Día.
}

export interface HabitTask {
  id: string;
  areaPrkId: string; // Corresponds to area_prk_id in Supabase
  title: string;
  type: 'habit' | 'project' | 'task';
  created_at?: string;
  archived: boolean;
  
  startDate?: string; // Corresponds to start_date
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days' | null;
  frequencyDays?: string[] | null; // Corresponds to frequency_days
  weight: number;

  dueDate?: string | null; // Corresponds to due_date
  completionDate?: string | null; // Corresponds to completion_date

  completedToday?: boolean;

  isCritical: boolean; // Corresponds to is_critical

  // Campos para la medición de hábitos
  measurementType?: 'binary' | 'quantitative' | 'temporal' | null;
  measurementGoal?: { target: number; unit: string; } | null; // Corresponds to measurement_goal
}

export interface ProgressLog {
  id: string;
  habitTaskId: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  
  progressValue?: number | null; // Corresponds to progress_value
  completionPercentage?: number | null; // Corresponds to completion_percentage
}

export interface DailyProgressSnapshot {
  id: string;
  snapshot_date: string;
  progress: number; // Almacenado como decimal (e.g., 0.75 para 75%)
}


// Para el Diario Evolutivo
export interface JournalEntry {
  date: string;
  items: {
    type: 'habit' | 'project' | 'task';
    title: string;
    areaPrkTitle: string;
    lifePrkTitle: string;
  }[];
}

// Para el gráfico de progreso
export interface LifePrkProgressPoint {
  date: string;
  [lifePrkId: string]: number | string; // Allows 'date' and dynamic keys for each Life PRK
}

// Para la nueva vista de calendario
export interface CalendarDataPoint {
  date: string; // Changed to string for serialization
  progress: number;
  tasks: HabitTask[];
}

// Fase 1: Nueva tabla
export interface EmotionalPulse {
  id: string;
  pulseDate: string;
  emotionalStateTag: string;
  notes?: string;
  createdAt: string;
}

export type TimeRangeOption = '7d' | '30d' | '3m' | '1y';
