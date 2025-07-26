
import { format, parseISO } from 'date-fns';
import { getCalendarData } from '@/app/actions';
import { CalendarPageClient } from '@/components/calendar-page-client';

export const dynamic = 'force-dynamic';

// This is the main page component, a Server Component.
// Its only job is to fetch data and pass it to the Client Component.
export default async function CalendarPage({ searchParams }: { searchParams: { month?: string, ref_date?: string } }) {
  const today = new Date();
  
  const monthString = searchParams.month || format(today, 'yyyy-MM-dd');
  const monthDate = parseISO(monthString);
  
  const refDateString = searchParams.ref_date || format(today, 'yyyy-MM-dd');
  const referenceDate = parseISO(refDateString);

  const initialData = await getCalendarData(monthDate, referenceDate);

  return (
    <CalendarPageClient 
        initialData={initialData}
        initialMonthString={monthString}
        initialReferenceDateString={refDateString}
    />
  );
}
