
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  // Always use the server's current date for initial data fetching.
  const serverDate = new Date();
  const calendarData = await getCalendarData(serverDate);
  const supabase = createClient();
  const { data: areaPrks, error } = await supabase.from('area_prks').select('*').eq('archived', false);

  if (error) {
    console.error("Error fetching Area PRKs for calendar page:", error);
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProgressCalendar 
        initialData={calendarData} 
        initialDate={serverDate.toISOString()}
        initialAreaPrks={areaPrks || []}
      />
    </main>
  );
}

    