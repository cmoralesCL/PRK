
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const currentDate = new Date();
  const calendarData = await getCalendarData(currentDate);

  // Convert Date objects to strings for safe serialization
  const serializableData = calendarData.map(d => ({ ...d, date: d.date.toISOString() }));

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProgressCalendar initialData={serializableData} initialDate={currentDate.toISOString()} />
    </main>
  );
}
