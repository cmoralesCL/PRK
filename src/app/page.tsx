import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/server/queries';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { lifePrks, areaPrks, habitTasks } = await getDashboardData();

  return (
    <Dashboard
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      habitTasks={habitTasks}
    />
  );
}
