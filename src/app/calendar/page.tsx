
import { format, parseISO } from 'date-fns';
import { getCalendarData } from '@/app/actions';
import { CalendarPageClient } from '@/components/calendar-page-client';
import { Header } from '@/components/header';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const today = new Date();
  
  const monthString = searchParams.month || format(today, 'yyyy-MM-dd');
  const monthDate = parseISO(monthString);
  
  const initialData = await getCalendarData(monthDate);

  const handleAddLifePrk = async () => {
    'use server';
    redirect('/panel?addLifePrk=true');
  };

  return (
    <>
        <Header onAddLifePrk={handleAddLifePrk} />
        <CalendarPageClient 
            initialData={initialData}
            initialMonthString={monthString}
        />
    </>
  );
}
