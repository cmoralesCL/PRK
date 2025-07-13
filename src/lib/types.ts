export interface LifePrk {
  id: string;
  title: string;
  description: string;
}

export interface KeyPrk {
  id: string;
  lifePrkId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

export interface HabitTask {
  id: string;
  keyPrkId: string;
  title: string;
  type: 'habit' | 'task';
  completed: boolean;
}
