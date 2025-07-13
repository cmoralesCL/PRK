import { Dashboard } from '@/components/dashboard';
import { getInitialData } from '@/lib/data';

export default function Home() {
  const { lifePrks, areaPrks, habitTasks } = getInitialData();

  return (
    <Dashboard
      initialLifePrks={lifePrks}
      initialAreaPrks={areaPrks}
      initialHabitTasks={habitTasks}
    />
  );
}
