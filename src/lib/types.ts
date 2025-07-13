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
  progress?: number; // Añadido para el nuevo cálculo
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
  weight?: number;

  // Para saber si ya se completó hoy (solo para la UI)
  completedToday?: boolean;
}

export interface ProgressLog {
  id: string;
  habitTaskId: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
}
