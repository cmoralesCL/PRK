
import { getCalendarData } from '@/app/actions';
import { CalendarView } from '@/components/calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();
  
  const { dailyProgress, habitTasks, areaPrks } = await getCalendarData(currentMonth);

  return (
    <CalendarView 
      initialMonth={currentMonth}
      dailyProgressData={dailyProgress}
      habitTasksData={habitTasks}
      areaPrks={areaPrks || []}
    />
  );
}
