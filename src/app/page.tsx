import * as React from 'react';
import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/actions';

export const dynamic = 'force-dynamic';

// Este componente obtiene los datos y los pasa al Dashboard.
// Se renderizará dentro de un Suspense boundary.
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

// El componente de la página principal ahora es más simple y configura el Suspense.
export default function Home({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];

  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen text-2xl font-headline">Cargando...</div>}>
      <DashboardWrapper selectedDate={selectedDate} />
    </React.Suspense>
  );
}
