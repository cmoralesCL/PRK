export interface LifePrk {
  id: string;
  title: string;
  description: string;
  created_at?: string;
  archived: boolean;
}

export interface AreaPrk {
  id: string;
  lifePrkId: string; // Corresponds to life_prk_id in Supabase
  title: string;
  targetValue: number; // Corresponds to target_value
  currentValue: number; // Corresponds to current_value
  unit: string;
  created_at?: string;
  archived: boolean;
}

export interface HabitTask {
  id: string;
  areaPrkId: string; // Corresponds to area_prk_id in Supabase
  title: string;
  type: 'habit' | 'task';
  completed: boolean;
  value: number;
  created_at?: string;
  archived: boolean;
}
