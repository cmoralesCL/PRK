import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];
  const { lifePrks, areaPrks, habitTasks } = await getDashboardData(selectedDate);

  return (
    <Dashboard
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      habitTasks={habitTasks}
      selectedDate={selectedDate}
    />
  );
}
