
import { getSimpleTasks } from "@/app/actions";
import { SimpleTaskList } from "@/components/simple-task-list";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const tasks = await getSimpleTasks();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SimpleTaskList initialTasks={tasks} />
      </div>
    </main>
  );
}
