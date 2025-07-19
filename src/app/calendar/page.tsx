
import { getCalendarData } from '@/app/actions';
import { CalendarView } from '@/components/calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();
  
  // Ensure the date is set to the start of the day to avoid timezone issues between server and client.
  currentMonth.setHours(0, 0, 0, 0);

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
