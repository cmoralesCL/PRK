import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/server/queries';

export default async function Home() {
  const { lifePrks, areaPrks, habitTasks } = await getDashboardData();

  return (
    <Dashboard
      initialLifePrks={lifePrks}
      initialAreaPrks={areaPrks}
      initialHabitTasks={habitTasks}
    />
  );
}
