
import * as React from 'react';
import { Dashboard } from '@/components/dashboard';
import { getDashboardData } from '@/app/actions';
import { parseISO, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: { date?: string } }) {
  const selectedDate = searchParams.date || format(new Date(), 'yyyy-MM-dd');

  const { lifePrks, areaPrks, habitTasks, commitments } = await getDashboardData(selectedDate);

  return (
    <Dashboard
      lifePrks={lifePrks}
      areaPrks={areaPrks}
      habitTasks={habitTasks}
      commitments={commitments}
      initialSelectedDate={selectedDate}
    />
  );
}
