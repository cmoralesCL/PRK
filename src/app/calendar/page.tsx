
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';
import type { AreaPrk } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const currentDate = new Date();
  const supabase = createClient();

  const [calendarDataResult, areaPrksResult] = await Promise.all([
    getCalendarData(currentDate),
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
        initialDate={currentDate.toISOString()}
        initialAreaPrks={areaPrks || []}
      />
    </main>
  );
}
