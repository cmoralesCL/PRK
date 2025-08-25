

import { QuoteOfTheDayOutput } from "@/ai/flows/get-quote-of-the-day";

export type ColorTheme = 'mint' | 'sapphire' | 'amethyst' | 'coral' | 'rose' | 'solar';

// Replaces LifePrk
export interface Orbit {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at?: string;
  archived: boolean;
  progress?: number; 
  color_theme?: ColorTheme;
}

// Replaces AreaPrk
export interface Phase {
  id: string;
  user_id: string;
  life_prk_id: string; // Corresponds to life_prk_id in Supabase
  title: string;
  description?: string | null;
  target_value: number; 
  current_value: number;
  unit: string;
  created_at?: string;
  archived: boolean;
  progress: number; 
  monthlyProgress: number;
  due_date?: string | null;
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


// Replaces HabitTask
export interface Pulse {
  id: string;
  user_id: string;
  phase_ids: string[]; // Replaces area_prk_ids
  title: string;
  description?: string | null;
  type: 'habit' | 'task';
  created_at?: string;
  archived: boolean;
  archived_at?: string | null;
  
  start_date?: string;
  
  frequency?: HabitFrequency | null;
  
  frequency_unit?: 'days' | 'weeks' | 'months' | null;
  frequency_interval?: number | null;
  frequency_days?: string[] | null;
  frequency_day_of_month?: number | null;
  
  weight: number;

  due_date?: string | null;
  completion_date?: string | null;

  completedToday?: boolean;
  current_progress_value?: number | null;

  is_critical: boolean;
  
  measurement_type?: 'binary' | 'quantitative' | null;
  measurement_goal?: { target_count?: number; unit?: string; } | null;
  
  logs?: ProgressLog[];
  progress?: number;
}

export interface ProgressLog {
  id: string;
  user_id: string;
  habit_task_id: string; // Corresponds to habit_task_id in Supabase
  completion_date: string;
  progress_value?: number | null;
  completion_percentage: number | null;
}

export interface DailyProgressSnapshot {
  snapshot_date: string;
  progress: number;
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
    orbitsCount: number;
    phasesCount: number;
    pulsesCompleted: number;
  };
  phases: (Phase & { progress: number; monthlyProgress: number })[];
  progressOverTime: {
    weekly: { date: string; Progreso: number }[];
    monthly: { date: string; Progreso: number }[];
    quarterly: { date: string; Progreso: number }[];
    yearly: { date: string; Progreso: number }[];
  };
  // Data for filters
  orbits: Orbit[];
  allPhases: Phase[];
  allPulses: Pulse[];
}
