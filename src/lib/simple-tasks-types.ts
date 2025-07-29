
'use server';

export interface SimpleTask {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  is_completed: boolean;
  start_date: string | null;
  due_date: string | null;
  // New fields for sharing & assigning
  owner_email?: string | null; // Email of the user who created the task
  assigned_to_user_id?: string | null; // ID of the user the task is assigned to
  assigned_to_email?: string | null; // Email of the user the task is assigned to
  shared_with?: { user_id: string; email: string }[] | null; // Array of users the task is shared with
}
