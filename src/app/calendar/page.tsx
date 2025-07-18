
import { Header } from '@/components/header';
import { ProgressCalendar } from '@/components/progress-calendar';
import { getCalendarData } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const calendarData = await getCalendarData(new Date());

  return (
    <>
      <Header
        onAddLifePrk={() => {}}
        selectedDate={new Date()} // Not used, but required by prop
        onDateChange={() => {}} // Not used, but required by prop
        hideDatePicker
        hideAddButton
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressCalendar initialData={calendarData} />
      </main>
    </>
  );
}
