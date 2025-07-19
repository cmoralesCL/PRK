export interface LifePrk {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  archived: boolean;
  progress?: number; // Añadido para el nuevo cálculo
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
  progress?: number | null; // Añadido para el nuevo cálculo, puede ser null
}

export interface HabitTask {
  id: string;
  areaPrkId: string; // Corresponds to area_prk_id in Supabase
  title: string;
  type: 'habit' | 'task';
  created_at?: string;
  archived: boolean;
  progress?: number; // Añadido para el nuevo cálculo
  
  // Nuevos campos para hábitos
  startDate?: string; // Corresponds to start_date
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days' | null;
  frequencyDays?: string[] | null; // Corresponds to frequency_days
  weight: number;

  // Nuevo campo para tareas
  dueDate?: string | null; // Corresponds to due_date
  completionDate?: string | null; // Corresponds to completion_date

  // Para saber si ya se completó hoy (solo para la UI)
  completedToday?: boolean;

  // Fase 1: Nuevos campos
  isCritical: boolean; // Corresponds to is_critical
  measurementGoal?: { target: number; unit: string; } | null; // Corresponds to measurement_goal
}

export interface ProgressLog {
  id: string;
  habitTaskId: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  
  // Fase 1: Nuevos campos
  progressValue?: number | null; // Corresponds to progress_value
  completionPercentage?: number | null; // Corresponds to completion_percentage
}

// Para el Diario Evolutivo
export interface JournalEntry {
  date: string;
  items: {
    type: 'habit' | 'task';
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
  userId: string;
  pulseDate: string;
  emotionalStateTag: string;
  notes?: string;
  createdAt: string;
}
