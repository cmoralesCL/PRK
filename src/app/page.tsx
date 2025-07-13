import { Dashboard } from '@/components/dashboard';
import { getInitialData } from '@/lib/data';

export default function Home() {
  const { lifePrks, keyPrks, habitTasks } = getInitialData();

  return (
    <Dashboard
      initialLifePrks={lifePrks}
      initialKeyPrks={keyPrks}
      initialHabitTasks={habitTasks}
    />
  );
}
