
import { getCalendarData } from '@/app/actions';
import { CalendarView } from '@/components/calendar-view';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  // Use the search param date or create a new date object for the current date.
  const selectedDate = searchParams.month ? new Date(searchParams.month) : new Date();
  
  // Ensure the date is set to the start of the day to avoid timezone issues.
  selectedDate.setHours(0, 0, 0, 0);

  const { dailyProgress, habitTasks, areaPrks } = await getCalendarData(selectedDate);

  // Pass the date as a string to the client component to avoid hydration mismatches.
  const initialMonthString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <CalendarView 
      initialMonthString={initialMonthString}
      dailyProgressData={dailyProgress}
      habitTasksData={habitTasks}
      areaPrks={areaPrks || []}
    />
  );
}
