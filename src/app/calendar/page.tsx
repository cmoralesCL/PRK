
import { getCalendarData, addHabitTask, updateHabitTask, archiveHabitTask } from '@/app/actions';
import { CalendarView } from '@/components/calendar-view';
import { CommitmentsSidebar } from '@/components/commitments-sidebar';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const selectedDate = searchParams.month ? new Date(searchParams.month) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const { dailyProgress, habitTasks, areaPrks, weeklyProgress, commitments } = await getCalendarData(selectedDate);
  const initialMonthString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="flex flex-1">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarView 
          initialMonthString={initialMonthString}
          dailyProgressData={dailyProgress}
          habitTasksData={habitTasks}
          areaPrks={areaPrks || []}
          weeklyProgressData={weeklyProgress || []}
        />
      </main>
      <aside className="w-96 hidden lg:block bg-card/50 border-l p-4">
        <CommitmentsSidebar
          commitments={commitments || []}
          selectedDate={selectedDate}
        />
      </aside>
    </div>
  );
}
