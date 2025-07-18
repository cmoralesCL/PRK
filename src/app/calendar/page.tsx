
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/server/actions';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const currentDate = new Date();
  const calendarData = await getCalendarData(currentDate);

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProgressCalendar initialData={calendarData} initialDate={currentDate} />
    </main>
  );
}
