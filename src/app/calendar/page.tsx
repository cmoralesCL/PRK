
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';
import { startOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { date?: string } }) {
  // Use the date from search params or default to today's date ON THE SERVER.
  // The client component will initialize to its own 'today'.
  const serverDate = searchParams.date ? new Date(searchParams.date) : new Date();
  const initialDate = startOfDay(serverDate);

  const supabase = createClient();

  const [calendarDataResult, areaPrksResult] = await Promise.all([
    getCalendarData(initialDate),
    supabase.from('area_prks').select('*').eq('archived', false)
  ]);
  
  const calendarData = calendarDataResult;
  const { data: areaPrks, error: areaPrksError } = areaPrksResult;

  if (areaPrksError) {
    console.error("Error fetching Area PRKs for calendar page:", areaPrksError);
    // Handle error appropriately, maybe render an error message
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProgressCalendar 
        initialData={calendarData} 
        initialDate={initialDate.toISOString()}
        initialAreaPrks={areaPrks || []}
      />
    </main>
  );
}
