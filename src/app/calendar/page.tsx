
import { format, parseISO } from 'date-fns';
import { getCalendarData } from '@/app/actions';
import { CalendarPageClient } from '@/components/calendar-page-client';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const today = new Date();
  
  const monthString = searchParams.month || format(today, 'yyyy-MM-dd');
  const monthDate = parseISO(monthString);
  
  const initialData = await getCalendarData(monthDate);

  return (
    <>
        <Header />
        <CalendarPageClient 
            initialData={initialData}
            initialMonthString={monthString}
        />
    </>
  );
}
