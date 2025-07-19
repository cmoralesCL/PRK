import * as React from 'react';
import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/actions';

export const dynamic = 'force-dynamic';

async function DashboardWrapper({ selectedDate }: { selectedDate: string }) {
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

export default function Home({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];

  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-2xl font-headline">Cargando...</div></div>}>
      <DashboardWrapper selectedDate={selectedDate} />
    </React.Suspense>
  );
}
