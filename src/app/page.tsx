import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  // Usa la fecha de los parámetros de búsqueda o la fecha actual si no se proporciona.
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];
  const { lifePrks, areaPrks, habitTasks } = await getDashboardData(selectedDate);

  return (
    <Dashboard
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      habitTasks={habitTasks}
      initialSelectedDate={selectedDate}
    />
  );
}
