'use server';

export interface SimpleTask {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  is_completed: boolean;
  start_date: string | null;
  due_date: string | null;
}
