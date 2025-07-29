
import { getSimpleTasks } from "@/app/actions";
import { Header } from "@/components/header";
import { SimpleTaskList } from "@/components/simple-task-list";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const tasks = await getSimpleTasks();

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SimpleTaskList initialTasks={tasks} />
        </div>
      </main>
    </div>
  );
}
