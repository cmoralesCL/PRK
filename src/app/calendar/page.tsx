
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const currentDate = new Date();
  const calendarData = await getCalendarData(currentDate);

  // The data is already serializable, no need to map it again.
  const serializableData = calendarData;

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProgressCalendar initialData={serializableData} initialDate={currentDate.toISOString()} />
    </main>
  );
}
