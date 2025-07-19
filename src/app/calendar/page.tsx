
import { format } from 'date-fns';
import { getCalendarData } from '@/app/actions';
import { CalendarPageClient } from '@/components/calendar-page-client';

export const dynamic = 'force-dynamic';

// This is the main page component, a Server Component.
// Its only job is to fetch data and pass it to the Client Component.
export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const selectedDate = searchParams.month ? new Date(searchParams.month) : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const initialData = await getCalendarData(selectedDate);
  const initialMonthString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <CalendarPageClient 
        initialData={initialData}
        initialMonthString={initialMonthString}
        selectedDate={selectedDate}
    />
  );
}
