
import { getCalendarData } from '@/app/actions';
import { ProgressCalendar } from '@/components/progress-calendar';
import { Header } from '@/components/header';

export const dynamic = 'force-dynamic';

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();
  
  const { dailyProgress, habitTasks } = await getCalendarData(currentMonth);

  return (
    <>
      <Header 
        // @ts-ignore
        onAddLifePrk={() => {}} 
        selectedDate={new Date()} 
        // @ts-ignore
        onDateChange={() => {}} 
        hideAddButton={true} 
        hideDatePicker={true} 
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressCalendar
          initialMonth={currentMonth}
          dailyProgressData={dailyProgress}
          habitTasksData={habitTasks}
        />
      </main>
    </>
  );
}
