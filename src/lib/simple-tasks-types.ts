
'use server';

export interface SimpleTask {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  is_completed: boolean;
  start_date: string | null;
  due_date: string | null;
  // New fields for sharing
  owner_email?: string; // Email of the user who created the task
  shared_with?: { user_id: string; email: string }[]; // Array of users the task is shared with
}
